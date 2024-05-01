using System.Collections.Generic;

namespace FIGAPI.Models
{
    public class ArtistBoothSave
    {
        public int TotalBooths { get; set; }
        public int EventId { get; set; }
        public List<ArtistBooth> ArtistBooths { get; set; }
    }
}