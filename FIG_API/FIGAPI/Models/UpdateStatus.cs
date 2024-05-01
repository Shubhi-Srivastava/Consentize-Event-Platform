using System.ComponentModel.DataAnnotations;

namespace FIGAPI.Models
{
    public class Status
    {
        [Required]
        public int UserId { get; set; }
        [Required]
        public int EventId { get; set; }

    }

    public class NotificationStatus
    {
        [Required]
        public string notification { get; set; }

    }

    public class WalletAddress
    {
        public string wallet { get; set; }

    }

    public class PhoneNoUpdate{
        public string PhoneNumber {get;set;}
       
    }
     public class PasswordUpdate{
       
        public string Password {get;set;}
    }

   
}
