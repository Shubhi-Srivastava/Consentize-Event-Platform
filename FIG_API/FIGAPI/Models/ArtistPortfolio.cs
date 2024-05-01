using System.ComponentModel.DataAnnotations;

namespace FIGAPI.Models{
public class ArtistPortfolio {
     public int UserId { get; set; }
    public string Name { get; set; } = null!;
     public string? PersonalBio { get; set; }
     public string? Instagram { get; set; }

    public string? Facebook { get; set; }

    public string? Tiktok { get; set; }

    public string? Youtube { get; set; }

    public string? Twitter { get; set; }
     public string Email { get; set; }

    public string? PersonalWebsite { get; set; }
    public string? ProfilePhotoUrl { get; set; }
     public List<object>? DesignerArtifacts { get; set; }
}
}

