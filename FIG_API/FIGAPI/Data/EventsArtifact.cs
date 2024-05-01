using System;
using System.Collections.Generic;

namespace FIGAPI.Data;

public partial class EventsArtifact
{
    public string? Link { get; set; }

    public string? LinkDescription { get; set; }

    public int? EventId { get; set; }

    public int EventArtifactId { get; set; }

    public virtual Event? Event { get; set; }
}
