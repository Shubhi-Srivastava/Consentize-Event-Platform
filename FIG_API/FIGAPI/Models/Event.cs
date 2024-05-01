using System.ComponentModel.DataAnnotations;

namespace FIGAPI.Models
{

    public class S3Object
    {
        public string Name { get; set; } = null!;
        public MemoryStream InputStream { get; set; } = null!;
        public string BucketName { get; set; } = null!;
    }

    public class S3ResponseDto
    {
        public int StatusCode { get; set; }
        public string Message { get; set; }
    }

    public class AwsCredentials
    {
        public string AccessKey { get; set; } = "";
        public string SecretKey { get; set; } = "";
    }

    public class Constants
    {
        public static string AccessKey = "AccessKey";
        public static string SecretKey = "SecretKey";
    }

    public class Publish
    {
        public int eventId { get; set; }
        public string eventFlag { get; set; }
    }

    public class EventBooths
    {
        public int eventId { get; set; }
        public string eventName { get; set; }
        public int boothCount { get; set; }
    }

    public class QRScanner
    {
        public int eventId { get; set; }
        public int boothId { get; set; }
        public int userId { get; set; }
    }


}