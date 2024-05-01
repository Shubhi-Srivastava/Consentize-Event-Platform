using System.ComponentModel.DataAnnotations;

namespace FIGAPI.Models
{
    public class ArtistBooth
    {
        public string Name { get; set; }
        public string EmailAddress { get; set; }
        public int BoothNumber { get; set; }

        public int DesignerId {get;set;}
        public string QRCodeURL {get; set;}
    }

}