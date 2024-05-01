using System;
using System.Collections.Generic;

namespace FIGAPI.Models;

public partial class Attendee
{
    public int UserId { get; set; }

    public string Name { get; set; } = null!;

    public string? PhoneNumber { get; set; }

    public string EmailAddress { get; set; } = null!;

    public string? NotificationStatus { get; set; }

    public string? DigitatWallet { get; set; }

    public string? UserType { get; set; }

    public int BoothNoCount { get; set; }


}
