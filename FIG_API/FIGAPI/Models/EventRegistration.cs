using System.ComponentModel.DataAnnotations;

namespace FIGAPI.Models{
public class EventRegistration
{
    public int EventId { get; set; }
    public int UserId { get; set; }
}
}