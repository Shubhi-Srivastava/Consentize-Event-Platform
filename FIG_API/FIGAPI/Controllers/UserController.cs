using Microsoft.AspNetCore.Mvc;
using FIGAPI.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Cors;
using FIGAPI.Models;
using FIGAPI.Services;


namespace FIGAPI.Controllers
{
    [EnableCors("AllowOrigin")]
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : Controller
    {

        private readonly FigContext _dbContext;

        private readonly IStorageService _storageService;
        private readonly IConfiguration _config;

        public UserController(FigContext dbContext, IConfiguration config, IStorageService storageService)
        {

            _dbContext = dbContext;
            _config = config;
            _storageService = storageService;
        }


        [HttpGet("{userType}")]
        public async Task<ActionResult<List<object>>> GetUsersByType([FromQuery] int eventId, string userType)
        {
            var result = await _dbContext.Users
                .Where(u => _dbContext.UserEvents
                    .Any(ue => ue.UserId == u.UserId && ue.EventId == eventId && ue.UserType == userType && ue.ApprovalStatus == "Y"))
                .Select(u => new
                {
                    u.UserId,
                    u.Name,
                    u.PhoneNumber,
                    u.EmailAddress,
                    u.Password,
                    u.ProfilePhotoUrl,
                    u.Token,
                    u.TokenCreated,
                    u.TokenExpires,
                    u.RefreshToken,
                    u.RefreshTokenExpires,
                    u.ResetCode,
                    UserEvent = _dbContext.UserEvents
                        .Where(ue => ue.UserId == u.UserId && ue.EventId == eventId && ue.UserType == userType && ue.ApprovalStatus == "Y")
                        .Select(ue => new
                        {
                            ue.UserEventId,
                            ue.NotificationStatus,
                            ue.DigitatWallet,
                            ue.PersonalBio,
                            ue.Instagram,
                            ue.Facebook,
                            ue.Tiktok,
                            ue.Youtube,
                            ue.PersonalWebsite,
                            ue.Twitter
                        })
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(result);
        }


        [HttpGet("Admins/{eventId}")]
        public async Task<ActionResult<IEnumerable<User>>> GetAdmins(int eventId)
        {
            var result = await _dbContext.Users
                .Where(u => _dbContext.UserEvents
                    .Any(ue => ue.UserId == u.UserId && ue.UserType == "Admin"))
                .Select(u => new
                {
                    u.UserId,
                    u.Name,
                    u.PhoneNumber,
                    u.EmailAddress,
                    u.Password,
                    u.ProfilePhotoUrl,
                    u.Token,
                    u.TokenCreated,
                    u.TokenExpires,
                    u.RefreshToken,
                    u.RefreshTokenExpires,
                    u.ResetCode,
                    UserEvent = _dbContext.UserEvents
                        .Where(ue => ue.UserId == u.UserId && ue.UserType == "Admin")
                        .Select(ue => new
                        {
                            ue.UserEventId,
                            ue.NotificationStatus,
                            ue.DigitatWallet,
                            ue.PersonalBio,
                            ue.Instagram,
                            ue.Facebook,
                            ue.Tiktok,
                            ue.Youtube,
                            ue.PersonalWebsite,
                            ue.Twitter
                        })
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Ok(result);
        }

        [HttpGet("{userId:int}")]
        public async Task<ActionResult<List<object>>> GetUserById(int userId,[FromQuery] int eventId) 
        {
            var users = await _dbContext.UserEvents
                .Where(ue => ue.EventId == eventId && ue.UserId == userId)
                .Join(_dbContext.Users, ue => ue.UserId, u => u.UserId, (ue, u) => new { UserEvent = ue, User = u })
                .ToListAsync();


            return Ok(users);

        }
        [HttpGet("users/{userId}/accountDetails")]
        public async Task<ActionResult> GetAccountDetails(int userId)
        {
            var user = await _dbContext.Users.FindAsync(userId);

            if (user == null)
            {
                return NotFound();
            }

            var result = new
            {
                Name = user.Name,
                Phone_Number = user.PhoneNumber,
                Email_Address = user.EmailAddress,
                Password = user.Password,
                ProfilePhoto_URL = user.ProfilePhotoUrl,
                ProfilePhoto_Description = user.ProfilePhotoDescription
            };
            return Ok(result);

        }
        [HttpPut("phoneNoUpdate/{userId}")]
        public async Task<IActionResult> UpdateMobileNo(int userId, PhoneNoUpdate phoneNoUpdate)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.UserId == userId);

            if (user == null)
            {
                return NotFound();
            }

            user.PhoneNumber = phoneNoUpdate.PhoneNumber;

            await _dbContext.SaveChangesAsync();

            return Ok();
        }
        [HttpPut("passwordUpdate/{userId}")]
        public async Task<IActionResult> UpdatePassword(int userId, PasswordUpdate passwordUpdate)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.UserId == userId);

            if (user == null)
            {
                return NotFound();
            }


            user.Password = passwordUpdate.Password;
            await _dbContext.SaveChangesAsync();

            return Ok();
        }
        [HttpPost("uploadProfilePhoto")]
        public async Task<IActionResult> UploadProfilePhoto(IFormFile ProfilePhoto, [FromForm] String description)
        {
            if (ProfilePhoto == null)
            {
                return BadRequest("No files were provided for upload.");
            }

            if (description == null)
            {
                return BadRequest("Invalid type");
            }

            var results = new S3ResponseDto();
            var file = ProfilePhoto;
            var type = description;
            await using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            var fileExt = Path.GetExtension(file.FileName);
            var docName = description + fileExt;

            var s3Obj = new S3Object()
            {
                BucketName = "fig-bucket",
                InputStream = memoryStream,
                Name = docName
            };

            var cred = new AwsCredentials()
            {
                AccessKey = _config["AwsConfiguration:AWSAccessKey"],
                SecretKey = _config["AwsConfiguration:AWSSecretKey"]
            };
            string[] parts = description.Split('-');
            int userid = int.Parse(parts[0]);

            try
            {
                var result = await _storageService.UploadFileAsync(s3Obj, cred, type);

                if (result != null)
                {
                    var user = await _dbContext.Users.FindAsync(userid);
                    if (user != null)
                    {
                        user.ProfilePhotoDescription = description;
                        user.ProfilePhotoUrl = "https://fig-bucket.s3.amazonaws.com/" + docName;
                        await _dbContext.SaveChangesAsync();
                    }
                    results = result;
                }
            }
            catch (Exception ex)
            {
                return BadRequest($"An error occurred while uploading file: {ex.Message}");
            }

            return Ok(results);
        }


        [HttpPost("editProfilePhotoImages")]
        public async Task<IActionResult> EditProfilePhotoImages(IFormFile ProfilePhoto, [FromForm] String description)
        {
            if (ProfilePhoto == null)
            {
                return BadRequest("No files were provided for upload.");
            }

            if (description == null)
            {
                return BadRequest("Invalid number of types provided.");
            }

            var cred = new AwsCredentials()
            {
                AccessKey = _config["AwsConfiguration:AWSAccessKey"],
                SecretKey = _config["AwsConfiguration:AWSSecretKey"]
            };
            string[] parts = description.Split('-');
            int userid = int.Parse(parts[0]);
            var user = await _dbContext.Users.FindAsync(userid);

            if (user != null)
            {
                if (user.ProfilePhotoDescription != null && user.ProfilePhotoDescription != description)
                {
                    var name = Path.GetFileName(new Uri(user.ProfilePhotoUrl).LocalPath);
                    var result = await _storageService.DeleteFileAsync(name, cred);
                    if (result == null)
                    {
                        return BadRequest($"Failed to delete file: {result.Message}");
                    }


                    var results = new S3ResponseDto();
                    var file = ProfilePhoto;
                    var type = description;
                    await using var memoryStream = new MemoryStream();
                    await file.CopyToAsync(memoryStream);
                    var fileExt = Path.GetExtension(file.FileName);
                    var docName = description + fileExt;

                    var s3Obj = new S3Object()
                    {
                        BucketName = "fig-bucket",
                        InputStream = memoryStream,
                        Name = docName
                    };
                    try
                    {
                        var res = await _storageService.UploadFileAsync(s3Obj, cred, type);

                        if (res != null)
                        {

                            user.ProfilePhotoDescription = description;
                            user.ProfilePhotoUrl = "https://fig-bucket.s3.amazonaws.com/" + docName;
                            await _dbContext.SaveChangesAsync();

                            results = res;
                        }
                    }
                    catch (Exception ex)
                    {
                        return BadRequest($"An error occurred while uploading file: {ex.Message}");
                    }

                    return Ok(results);
                }

            }

            return BadRequest("User not found.");
        }














    }
}
