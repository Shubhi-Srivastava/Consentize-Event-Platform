using System.ComponentModel.DataAnnotations;

namespace FIGAPI.Models
{
public class RegistrationData
{
    public EventRegistration Registration { get; set; }
    public ArtistPortfolio ArtistPortfolio { get; set; }
}

}