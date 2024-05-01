using System.ComponentModel.DataAnnotations;

namespace FIGAPI.Models
{
    public class Login
    {
        [Required]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }
        [Required]
        public int EventId { get; set; }
    }

    public class ForgotPassword
    {
        [Required]
        public string Email { get; set; }
        [Required]
        public string Code { get; set; }

    }

    public class ResetPassword
    {
        [Required]
        public string Email { get; set; }
    }

    public class UpdatePassword
    {
        [Required]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }
    }

    public class LoginWithGoogle
    {
        [Required]
        public string Credentials { get; set; }
        [Required]
        public int EventId { get; set; }
    }

    public class TokenResponse
    {
        public string Token { get; set; }
        public DateTime TokenExpires { get; set; }
        public string RefreshToken { get; set; }
    }

    // RefreshTokenRequest class definition
    public class RefreshTokenRequest
    {
        public string Token { get; set; }
        public string RefreshToken { get; set; }
    }

    // RevokeTokenRequest class definition
    public class RevokeTokenRequest
    {
        public string Token { get; set; }
    }



}
