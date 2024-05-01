using System;
using System.Collections.Generic;

namespace FIGAPI.Data;

public partial class Event
{
    public string? EventName { get; set; }

    public string? EventLocation { get; set; }

    public DateTime? EventStartTime { get; set; }

    public int EventId { get; set; }

    public DateTime? EventEndTime { get; set; }

    public string? TicketLink { get; set; }

    public string? EventBio { get; set; }

    public string? CurrentEvent { get; set; }

    public int? Booths { get; set; }

    public string? PublishEvent { get; set; }

    //public virtual ICollection<Booth> BoothsNavigation { get; } = new List<Booth>();

   // public virtual ICollection<EventsArtifact> EventsArtifacts { get; } = new List<EventsArtifact>();

    //public virtual ICollection<UserEvent> UserEvents { get; } = new List<UserEvent>();
}
