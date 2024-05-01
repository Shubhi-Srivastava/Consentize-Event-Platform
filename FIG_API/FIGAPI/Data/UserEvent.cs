using System;
using System.Collections.Generic;

namespace FIGAPI.Data;

public partial class UserEvent
{
    public int UserId { get; set; }

    public int EventId { get; set; }

    public string UserType { get; set; } = null!;

    public string ApprovalStatus { get; set; } = null!;

    public int UserEventId { get; set; }

    public string? NotificationStatus { get; set; }

    public string? DigitatWallet { get; set; }

    public string? PersonalBio { get; set; }

    public string? Instagram { get; set; }

    public string? Facebook { get; set; }

    public string? Tiktok { get; set; }

    public string? Youtube { get; set; }

    public string? PersonalWebsite { get; set; }

    public string? Twitter { get; set; }

    public string? DigitalGoodiesReceived { get; set; }

    public virtual Event Event { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
