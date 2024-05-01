using System.ComponentModel.DataAnnotations;

namespace FIGAPI.Models{
public class DigitalGoodiesUpdate {



    public int UserId { get; set; }
    public int EventId { get; set; }
    public string DigitalGoodiesReceived { get; set; }
}

}
