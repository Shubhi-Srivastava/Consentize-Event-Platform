namespace FIGAPI.Models
{
    public partial class Image
    {
        public IFormFile file { get; set; }

        public string eventName { get; set; }

        public string imageType { get; set; }

    }

}