using System;
using System.Collections.Generic;

namespace FIGAPI.Data;

public partial class Booth
{
    public int BoothId { get; set; }

    public int? EventId { get; set; }

    public int? CheckinsCount { get; set; }

    public string? DesignerName { get; set; }

    public string? QrCodeUrl { get; set; }

    public int? DesignerId { get; set; }

    public int BoothNo { get; set; }

    public virtual Event? Event { get; set; }
}
