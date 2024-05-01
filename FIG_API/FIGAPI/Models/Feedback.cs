using System.ComponentModel.DataAnnotations;

namespace FIGAPI.Models
{

    public class FeedbackRequest
    {
        public string FromEmail { get; set; }
        public string Name { get; set; }
        public string ToEmail { get; set; }
        public string ToName { get; set; }
        public string Subject { get; set; }
        public string Content { get; set; }
        public int EventId { get; set; }
    }

}