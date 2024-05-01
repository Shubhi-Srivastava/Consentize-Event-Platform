using System;
using System.Collections.Generic;

namespace FIGAPI.Data;

public partial class User
{
    public int UserId { get; set; }

    public string Name { get; set; } = null!;

    public string? PhoneNumber { get; set; }

    public string EmailAddress { get; set; } = null!;

    public string? Password { get; set; }

    public string? Token { get; set; }

    public DateTime? TokenCreated { get; set; }

    public DateTime? TokenExpires { get; set; }

    public string? RefreshToken { get; set; }

    public DateTime? RefreshTokenExpires { get; set; }

    public string? ResetCode { get; set; }

    public string? ProfilePhotoUrl { get; set; }

    public string? ProfilePhotoDescription { get; set; }

   //public virtual ICollection<DesignerArtifact> DesignerArtifacts { get; } = new List<DesignerArtifact>();

    //public virtual ICollection<EventBoothsVisited> EventBoothsVisiteds { get; } = new List<EventBoothsVisited>();

   //public virtual ICollection<UserEvent> UserEvents { get; } = new List<UserEvent>();
}
