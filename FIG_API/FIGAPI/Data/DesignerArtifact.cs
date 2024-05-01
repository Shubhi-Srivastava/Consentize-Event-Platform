using System;
using System.Collections.Generic;

namespace FIGAPI.Data;

public partial class DesignerArtifact
{
    public string? Link { get; set; }

    public string? LinkDescription { get; set; }

    public int? EventId { get; set; }

    public int? UserId { get; set; }

    public int DesignerArtifactId { get; set; }

    public virtual User? User { get; set; }
}
