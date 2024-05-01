using System.ComponentModel.DataAnnotations;

namespace FIGAPI.Models
{
    public partial class EventDesigners
    {
        public Designer[] Designers { get; set; } = new Designer[] { };
    }

    public partial class Designer
    {
        public string Name { get; set; } = null!;

        public string EmailAddress { get; set; } = null!;

        public string UserType { get; set; } = null!;
    }

}