using Google.Apis.Auth;
using FIGAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Cors;
using FIGAPI.Data;
using Google.Apis.Auth.OAuth2.Responses;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using MimeKit;

namespace FIGAPI.Controllers
{
    [EnableCors("AllowOrigin")]
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : Controller
    {
        private readonly AppSettings _applicationSettings;
        private readonly HttpClient _httpClient;
        private readonly FigContext _context;
        private readonly string _smtpServer;
        private readonly int _smtpPort;

        private readonly IConfiguration _configuration;

        public AuthController(IOptions<AppSettings> _applicationSettings, HttpClient httpClient, FigContext context, IConfiguration configuration)
        {
            this._applicationSettings = _applicationSettings.Value;
            _httpClient = httpClient;
            _context = context;
            _configuration = configuration;
            _smtpServer = "smtp.gmail.com";
            _smtpPort = 587;
        }


        private static byte[] GenerateSecretKey(int length = 32)
        {
            var randomBytes = new byte[length];
            using (var rng = new RNGCryptoServiceProvider())
            {
                rng.GetBytes(randomBytes);
            }
            return randomBytes;
        }



        [HttpPost("Login")]
        public IActionResult Login([FromBody] Login model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if email is present in the database
            var user = _context.Users.SingleOrDefault(u => u.EmailAddress == model.Email);
            if (user == null)
            {

                return NotFound("Email not found. Please sign up.");
            }

            if (model.Password != user.Password)
            {
                return BadRequest("Invalid password.");
            }

            var token = GenerateJwtToken(user);
            var currentEventId = model.EventId;
            var attendeeUrl = $"/attendee-event/{user.UserId}/{currentEventId}";

            // Generate refresh token
            var refreshToken = GenerateRefreshToken();

            // Save token, tokenCreated and tokenExpires fields in Users table
            user.Token = token.Token;
            user.TokenCreated = token.Created;
            user.TokenExpires = token.Expires;
            user.RefreshToken = refreshToken.Token;
            user.RefreshTokenExpires = refreshToken.Expires;

            _context.SaveChanges();

            var isAdmin = _context.UserEvents.Any(ue => ue.UserId == user.UserId && ue.UserType == "Admin");
            if (isAdmin)
            {
                // Redirect to admin page
                var adminUrl = $"/admin-page/{user.UserId}";
                return Ok(new { Url = adminUrl, userId = user.UserId, userType = "Admin", token = user.Token });
            }
            else
            {
                var userEvent = _context.UserEvents.SingleOrDefault(ue => ue.UserId == user.UserId && ue.EventId == currentEventId);
                if (userEvent == null)
                {

                    var lastUserEventId = _context.UserEvents.OrderByDescending(u => u.UserEventId).Select(u => u.UserEventId).FirstOrDefault();
                    var newUserEvent = new UserEvent
                    {
                        UserEventId = lastUserEventId + 1,
                        UserId = user.UserId,
                        UserType = "Attendee",
                        EventId = model.EventId,
                        NotificationStatus = "N"
                    };
                    return Ok(new { Url = attendeeUrl, userId = user.UserId, userType = "Attendee", token = user.Token });
                }
                else if (userEvent.UserType != "Attendee")
                {
                    // Check if the user type is 'artist' and approval status is 'Y'
                    userEvent = _context.UserEvents.SingleOrDefault(ue => ue.UserId == user.UserId && ue.EventId == currentEventId && ue.UserType == "Artist" && ue.ApprovalStatus == "Y");
                    if (userEvent != null)
                    {
                        var artistUrl = $"/artist-page/{user.UserId}/{currentEventId}";
                        return Ok(new { Url = artistUrl, userId = user.UserId, userType = "Artist", token = user.Token, approvalStatus = userEvent.ApprovalStatus });
                    }
                    userEvent = _context.UserEvents.SingleOrDefault(ue => ue.UserId == user.UserId && ue.EventId == currentEventId && ue.UserType == "Artist" && ue.ApprovalStatus == "P");
                    if(userEvent?.ApprovalStatus ==  "P") return BadRequest("Approval Pending");

                    // User is not in DB, display a message
                    return BadRequest("You need to sign up first.");
                }

                // Return success response to frontend
                return Ok(new { Url = attendeeUrl, userId = user.UserId, userType = "Attendee", token = user.Token });
            }
        }

        [HttpPost("Register")]
        public IActionResult Register([FromBody] Register model)
        {
            // Check if user already exists in Users table
            var existingUser = _context.Users.FirstOrDefault(u => u.EmailAddress == model.Email);
            if (existingUser != null)
            {
                return BadRequest(new { success = false, message = "User already exists click on Login" });
            }

            // Check if password and confirm password match
            if (model.Password != model.ConfirmPassword)
            {
                return BadRequest(new { success = false, message = "Password and Confirm Password do not match" });
            }

            // Get the last User ID in the Users table
            var lastUserId = _context.Users.OrderByDescending(u => u.UserId).Select(u => u.UserId).FirstOrDefault();
            var lastUserEventId = _context.UserEvents.OrderByDescending(u => u.UserEventId).Select(u => u.UserEventId).FirstOrDefault();

            // Create new User object with incremented User ID and save to Users table
            var newUser = new User
            {
                UserId = lastUserId + 1, // Increment User ID
                Name = model.Name,
                EmailAddress = model.Email,
                Password = model.Password,
            };
            _context.Users.Add(newUser);

            // Create new UserEvent object and save to UserEvents table
            var userType = model.UserType;
            var newUserEvent = new UserEvent
            {
                UserEventId = lastUserEventId + 1,
                UserId = newUser.UserId,
                UserType = userType,
                EventId = model.EventId,
                ApprovalStatus = "P",
                NotificationStatus = "N"
            };
            _context.UserEvents.Add(newUserEvent);
            _context.SaveChanges();

            // Redirect to specific page based on user type
            if (userType == "Artist")
            {
                return Ok(new { success = true, userType = userType, userId = newUser.UserId, redirect = "/artist-profile" });
            }
            else if (userType == "Attendee")
            {
                return Ok(new { success = true, userType = userType, userId = newUser.UserId, redirect = "/attendee-event" });
            }
            else
            {
                // Return success response with user type and user ID
                return Ok(new { success = true, userType = userType, userId = newUser.UserId });
            }
        }

        // Helper method to generate JWT token
        private RefreshToken GenerateJwtToken(User user)
        {
            if (user == null)
            {
                throw new ArgumentNullException(nameof(user), "User cannot be null.");
            }
            int keySizeInBytes = 32; // 256 bits
            byte[] secretKey = GenerateSecretKey(keySizeInBytes);
            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new Claim[]
                {
                        new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier", user.UserId.ToString()),
                        new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", user.EmailAddress),
                }),
                Expires = DateTime.UtcNow.AddMinutes(30),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(secretKey), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);

            // Create token response
            var tokenResponse = new RefreshToken
            {
                Token = tokenHandler.WriteToken(token),
                Created = DateTime.UtcNow,
                Expires = DateTime.UtcNow.AddMinutes(30)
            };

            return tokenResponse;
        }

        // Helper method to generate refresh token
        private RefreshToken GenerateRefreshToken()
        {
            var refreshToken = new RefreshToken();
            var randomNumber = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomNumber);
                refreshToken.Token = Convert.ToBase64String(randomNumber);
            }
            refreshToken.Expires = DateTime.UtcNow.AddMinutes(Convert.ToDouble(_configuration["Jwt:RefreshTokenExpirationMinutes"]));

            return refreshToken;
        }

        // Helper method to save refresh token in the database
        private void SaveRefreshToken(int userId, RefreshToken refreshToken)
        {
            var user = _context.Users.SingleOrDefault(u => u.UserId == userId);
            if (user != null)
            {
                user.RefreshToken = refreshToken.Token;
                user.RefreshTokenExpires = refreshToken.Expires;
                _context.SaveChanges();
            }
        }

        [HttpPost("RefreshToken")]
        public IActionResult RefreshToken([FromBody] RefreshTokenRequest model)
        {
            // Validate refresh token
            var principal = GetPrincipalFromExpiredToken(model.Token);
            var userId = int.Parse(principal.Claims.First(c => c.Type == ClaimTypes.NameIdentifier).Value);
            var user = _context.Users.SingleOrDefault(u => u.UserId == userId);
            if (user == null || user.RefreshToken != model.RefreshToken || user.RefreshTokenExpires < DateTime.UtcNow)
            {
                return BadRequest("Invalid refresh token.");
            }

            // Generate new JWT token
            var token = GenerateJwtToken(user);

            // Generate new refresh token
            var refreshToken = GenerateRefreshToken();

            // Save new refresh token in the database
            SaveRefreshToken(userId, refreshToken);

            // Create token response
            var tokenResponse = new RefreshToken
            {
                Token = token.Token,
                Created = token.Created,
                Expires = token.Expires,
                refreshToken = refreshToken.Token
            };

            return Ok(tokenResponse);
        }

        [HttpPost("RevokeToken")]
        public IActionResult RevokeToken([FromBody] RevokeTokenRequest model)
        {
            // Check if token exists in the database
            var user = _context.Users.SingleOrDefault(u => u.Token == model.Token);
            if (user == null)
            {
                return NotFound("Token not found.");
            }

            // Revoke token by setting refresh token and its expiration to null
            user.RefreshToken = null;
            user.RefreshTokenExpires = null;
            _context.SaveChanges();

            return Ok("Token revoked successfully.");
        }

        private ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:SecretKey"])),
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = false // This allows expired tokens to be validated
            };

            try
            {
                var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
                if (!(securityToken is JwtSecurityToken jwtSecurityToken) || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                {
                    throw new SecurityTokenException("Invalid token");
                }
                return principal;
            }
            catch (Exception ex)
            {
                // Handle exception (e.g. log error)
                throw new SecurityTokenException("Failed to validate token", ex);
            }
        }


        [HttpPost("Logout")]
        public IActionResult Logout([FromBody] string token)
        {
            // Retrieve the current user's ID from the authenticated token
            var userId = GetUserIdFromToken(token);

            // Remove the refresh token from the user's record in the database
            var user = _context.Users.SingleOrDefault(u => u.UserId == userId);
            if (user != null)
            {
                user.RefreshToken = null;
                user.RefreshTokenExpires = null;
                _context.SaveChanges();
            }

            // Perform any additional logout logic, such as clearing authentication cookies or session data

            return Ok();
        }

        private int GetUserIdFromToken(string token)
        {
            //var token = HttpContext.Request.Headers[JwtBearerDefaults.AuthenticationScheme].ToString();
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);

            var userId = jwtToken.Claims.FirstOrDefault(c => c.Type == "nameid")?.Value;

            if (int.TryParse(userId, out int userid))
            {
                return userid;
            }
            else
            {
                throw new Exception("Unable to parse userId from token.");
            }
        }


        // public dynamic JWTGenerator(User user)
        // {
        //     var tokenHandler = new JwtSecurityTokenHandler();
        //     var key = Encoding.ASCII.GetBytes(this._applicationSettings.Secret);

        //     var tokenDescriptor = new SecurityTokenDescriptor
        //     {
        //         Subject = new ClaimsIdentity(new[] { new Claim("id", user.UserName), new Claim(ClaimTypes.Role, user.Role),
        //                 new Claim(ClaimTypes.DateOfBirth, user.BirthDay)}),
        //         Expires = DateTime.UtcNow.AddDays(7),
        //         SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha512Signature)
        //     };
        //     var token = tokenHandler.CreateToken(tokenDescriptor);
        //     var encrypterToken = tokenHandler.WriteToken(token);

        //     SetJWT(encrypterToken);

        //     var refreshToken = GenerateRefreshToken();

        //     SetRefreshToken(refreshToken, user);

        //     return new { token = encrypterToken, username = user.UserName };
        // }

        // private RefreshToken GenerateRefreshToken()
        // {
        //     var refreshToken = new RefreshToken()
        //     {
        //         Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
        //         Expires = DateTime.Now.AddDays(7),
        //         Created = DateTime.Now
        //     };

        //     return refreshToken;

        // }

        // [HttpGet("RefreshToken")]
        // public async Task<ActionResult<string>> RefreshToken()
        // {
        //     var refreshToken = Request.Cookies["X-Refresh-Token"];

        //     var user = UserList.Where(x => x.Token == refreshToken).FirstOrDefault();

        //     if (user == null || user.TokenExpires < DateTime.Now)
        //     {
        //         return Unauthorized("Token has expired");
        //     }

        //     GenerateJwtToken(user);

        //     return Ok();
        // }

        // public void SetRefreshToken(RefreshToken refreshToken, User user)
        // {

        //     HttpContext.Response.Cookies.Append("X-Refresh-Token", refreshToken.Token,
        //          new CookieOptions
        //          {
        //              Expires = refreshToken.Expires,
        //              HttpOnly = true,
        //              Secure = true,
        //              IsEssential = true,
        //              SameSite = SameSiteMode.None
        //          });

        //     UserList.Where(x => x.UserName == user.UserName).First().Token = refreshToken.Token;
        //     UserList.Where(x => x.UserName == user.UserName).First().TokenCreated = refreshToken.Created;
        //     UserList.Where(x => x.UserName == user.UserName).First().TokenExpires = refreshToken.Expires;
        // }

        // public void SetJWT(string encrypterToken)
        // {

        //     HttpContext.Response.Cookies.Append("X-Access-Token", encrypterToken,
        //           new CookieOptions
        //           {
        //               Expires = DateTime.Now.AddMinutes(15),
        //               HttpOnly = true,
        //               Secure = true,
        //               IsEssential = true,
        //               SameSite = SameSiteMode.None
        //           });
        // }

        // [HttpDelete("RevokeToken/{username}")]
        // public async Task<IActionResult> RevokeToken(string username)
        // {
        //     UserList.Where(x => x.UserName == username).First().Token = "";

        //     return Ok();
        // }

        [HttpPost("LoginWithGoogle")]
        public async Task<IActionResult> LoginWithGoogle([FromBody] LoginWithGoogle model)
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings()
            {
                Audience = new List<string> { "60777130845-5dd0h7fce940ioth0nfs8atkndnab01s.apps.googleusercontent.com" }
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(model.Credentials, settings);

            var user = _context.Users.Where(x => x.EmailAddress == payload.Email).FirstOrDefault();

            if (user != null)
            {
                var token = GenerateJwtToken(user);

                // Generate refresh token
                var refreshToken = GenerateRefreshToken();

                // Save token, tokenCreated and tokenExpires fields in Users table
                user.Token = token.Token;
                user.TokenCreated = token.Created;
                user.TokenExpires = token.Expires;
                user.RefreshToken = refreshToken.Token;
                user.RefreshTokenExpires = refreshToken.Expires;

                _context.SaveChanges();

                var isAdmin = _context.UserEvents.Any(ue => ue.UserId == user.UserId && ue.UserType == "Admin");

                if (isAdmin)
                {
                    // Redirect to admin page
                    var adminUrl = $"/admin-page/{user.UserId}";
                    return Ok(new { Url = adminUrl, userId = user.UserId, userType = "Admin", token = user.Token });
                }

                else
                {
                    // Check if the user type is 'attendee' for the current event
                    var currentEventId = 1; // need to replace this by how to take the event id from the landing page
                    var userEvent = _context.UserEvents.SingleOrDefault(ue => ue.UserId == user.UserId && ue.EventId == currentEventId);
                    if (userEvent == null || userEvent.UserType != "Attendee")
                    {
                        // Check if the user type is 'artist' and approval status is 'Y'
                        userEvent = _context.UserEvents.SingleOrDefault(ue => ue.UserId == user.UserId && ue.EventId == currentEventId && ue.UserType == "Artist" && ue.ApprovalStatus == "Y");
                        if (userEvent != null)
                        {
                            var artistUrl = $"/artist-page/{user.UserId}/{currentEventId}";
                            return Ok(new { Url = artistUrl, userId = user.UserId, userType = "Artist", token = user.Token, approvalStatus = userEvent.ApprovalStatus });
                        }

                        // User is not in DB, display a message
                        return BadRequest("You need to sign up first.");
                    }

                    // Return success response to frontend
                    var attendeeUrl = $"/attendee-event/{user.UserId}/{currentEventId}";
                    return Ok(new { Url = attendeeUrl, userId = user.UserId, userType = "Attendee", token = user.Token });
                }

            }
            else if (user == null)
            {
                var lastUserId = _context.Users.OrderByDescending(u => u.UserId).Select(u => u.UserId).FirstOrDefault();
                var lastUserEventId = _context.UserEvents.OrderByDescending(u => u.UserEventId).Select(u => u.UserEventId).FirstOrDefault();

                // Create new User object with incremented User ID and save to Users table
                var newUser = new User
                {
                    UserId = lastUserId + 1, // Increment User ID
                    Name = payload.Name,
                    EmailAddress = payload.Email,
                };
                _context.Users.Add(newUser);

                // Create new UserEvent object and save to UserEvents table
                var newUserEvent = new UserEvent
                {
                    UserEventId = lastUserEventId + 1,
                    UserId = newUser.UserId,
                    UserType = "Attendee",
                    EventId = model.EventId,
                    ApprovalStatus = "P"
                };
                _context.UserEvents.Add(newUserEvent);
                _context.SaveChanges();
                return Ok(new { success = true, userType = "Attendee", userId = newUser.UserId, redirect = "/attendee-event" });
            }
            else
            {
                return BadRequest();
            }
        }

        [HttpPost("ForgotPassword")]
        public async Task<IActionResult> ForgotPassword([FromBody] ResetPassword model)
        {
            var user = _context.Users.Where(x => x.EmailAddress == model.Email).FirstOrDefault();

            if (user == null)
            {
                return BadRequest("Invalid email address");
            }

            // Generate reset code
            var resetCode = GenerateResetCode();

            // Store reset code in user's record in database
            user.ResetCode = resetCode;
            _context.SaveChanges();

            try
            {
                var message = new MimeMessage();
                MailboxAddress from = new MailboxAddress("FIG_Team", "fig611ub@gmail.com");
                MailboxAddress to = new MailboxAddress(user.Name, user.EmailAddress);
                message.To.Add(to);
                message.From.Add(from);
                message.Sender = from;
                message.ReplyTo.Add(from);

                message.Subject = "Reset Code";

                message.Body = new TextPart("html")
                {
                    Text = "Here is the rest code : " + resetCode
                };

                using (var client = new MailKit.Net.Smtp.SmtpClient())
                {
                    client.Connect(_smtpServer, _smtpPort);

                    client.AuthenticationMechanisms.Remove("XOAUTH2");

                    client.Authenticate("fig611ub@gmail.com", "otwvjrxqxeaqwrgy");

                    client.Send(message);
                    client.Disconnect(true);
                }
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("CheckCode")]
        public async Task<IActionResult> CheckCode(ForgotPassword model)
        {
            var user = _context.Users.Where(x => x.EmailAddress == model.Email).FirstOrDefault();

            if (user.ResetCode == model.Code) return Ok();

            else return BadRequest("Enter Code Again");
        }

        [HttpPost("UpdatePassword")]
        public async Task<IActionResult> UpdatePassword(UpdatePassword model)
        {

            try
            {
                var user = _context.Users.Where(x => x.EmailAddress == model.Email).FirstOrDefault();

                user.Password = model.Password;

                _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }

        }

        private string GenerateResetCode()
        {
            var rng = new RNGCryptoServiceProvider();
            var bytes = new byte[4];
            rng.GetBytes(bytes);
            var resetCode = BitConverter.ToUInt32(bytes, 0);
            return resetCode.ToString("D6"); // Generate a 6-digit reset code
        }

    }
}
