using System.ComponentModel.DataAnnotations;

namespace FIGAPI.Models{
public class EventArtists
{
    public string EventName { get; set; }
    public string EventLocation { get; set; }
    public DateTime? EventStartTime { get; set; }
    public DateTime? EventEndTime { get; set; }
    public string TicketLink { get; set; }
    public string EventBio { get; set; }
    public string CurrentEvent { get; set; }
    public int? Booths { get; set;}
    public List<ArtistBooth> Artists { get; set; }
    public List<EventArtifact> Artifacts { get; set; }
}
}