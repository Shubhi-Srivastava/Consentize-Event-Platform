using System;
using System.Collections.Generic;

namespace FIGAPI.Data;

public partial class EventBoothsVisited
{
    public int? UserId { get; set; }

    public int? EventId { get; set; }

    public int? BoothNo { get; set; }

    public int EventBoothVisitedId { get; set; }

    public virtual User? User { get; set; }
}
