using Microsoft.AspNetCore.Mvc;
using FIGAPI.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Cors;
using FIGAPI.Models;
using MimeKit;

namespace FIGAPI.Controllers
{
    [EnableCors("AllowOrigin")]
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : Controller
    {

        private readonly FigContext _dbContext;
        private readonly IConfiguration _config;
        private readonly string _smtpServer;
        private readonly int _smtpPort;

        public AdminController(FigContext dbContext, IConfiguration config)
        {
            _dbContext = dbContext;
            _config = config;
            _smtpServer = "smtp.gmail.com";
            _smtpPort = 587;

        }

        [HttpGet("attendees")]
        public async Task<ActionResult<IEnumerable<Attendee>>> GetAttendeesForEvent(int eventId)
        {
            using (var db = new FigContext())
            {
                var attendees = await _dbContext.UserEvents
                .Where(ue => ue.EventId == eventId && ue.UserType == "Attendee")
                .Join(_dbContext.Users, ue => ue.UserId, u => u.UserId, (ue, u) => new Attendee
                {
                    UserId = ue.UserId,
                    Name = u.Name,
                    PhoneNumber = u.PhoneNumber,
                    EmailAddress = u.EmailAddress,
                    NotificationStatus = ue.NotificationStatus,
                    DigitatWallet = ue.DigitatWallet,
                    UserType = ue.UserType,
                    BoothNoCount = 0
                })
                .ToListAsync();

                var boothcounts = await _dbContext.EventBoothsVisiteds
                    .Where(ebv => ebv.UserId != null && ebv.EventId == eventId)
                    .GroupBy(ebv => ebv.UserId)
                    .Select(g => new
                    {
                        UserId = g.Key,
                        BoothNoCount = g.Count(ebv => ebv.BoothNo != null)
                    })
                    .ToListAsync();

                foreach (var attendee in attendees)
                {
                    var count = boothcounts.FirstOrDefault(bc => bc.UserId == attendee.UserId);
                    if (count != null)
                    {
                        attendee.BoothNoCount = count.BoothNoCount;
                    }
                }

                return attendees;
            }
        }
        [HttpGet("/booths-visited/{eventId}")]
        public async Task<ActionResult<List<object>>> getAttendeeBooths(int eventId)
        {
            var usersForEvent = await _dbContext.EventBoothsVisiteds
                .Where(ebv => ebv.EventId == eventId)
                .Select(ebv => ebv.UserId)
                .Distinct()
                .ToListAsync();

            var result = new List<object>();
            foreach (var userId in usersForEvent)
            {
                var boothsVisited = await _dbContext.EventBoothsVisiteds
                    .Where(ebv => ebv.EventId == eventId && ebv.UserId == userId)
                    .Select(ebv => ebv.BoothNo)
                    .ToListAsync();

                var userEventInfo = await _dbContext.UserEvents
                    .FirstOrDefaultAsync(ue => ue.EventId == eventId && ue.UserId == userId);
                if (userEventInfo != null)
                {
                    var digitalWallet = userEventInfo.DigitatWallet;
                    var notificationStatus = userEventInfo.NotificationStatus;
                    var digitalGoodiesReceived = userEventInfo.DigitalGoodiesReceived;

                    var userInfo = await _dbContext.Users
                        .Where(u => u.UserId == userId)
                        .Select(u => new
                        {
                            Name = u.Name,
                            EmailAddress = u.EmailAddress,
                            BoothsVisited = boothsVisited,
                            DigitatWallet = digitalWallet,
                            DigitalGoodiesReceived=  digitalGoodiesReceived,
                            NotificationStatus = notificationStatus,
                            PhoneNumber = u.PhoneNumber,
                            UserId = u.UserId
                            

                        })
                        .FirstOrDefaultAsync();

                    if (userInfo != null)
                    {
                        result.Add(userInfo);
                    }
                }
            }

            return result;
        }


    

        
        [HttpGet("artists")]
        public async Task<ActionResult<IEnumerable<Data.User>>> GetUnapprovedArtists(int eventId)
        {
            using (var db = new FigContext())
            {
                var users = await _dbContext.UserEvents
                .Where(ue => ue.EventId == eventId && ue.UserType == "Artist" && ue.ApprovalStatus == "N")
                .Join(_dbContext.Users, ue => ue.UserId, u => u.UserId, (ue, u) => u)
                .ToListAsync();

                return users;
            }
        }

        [HttpPost("submitFeedback")]
        public async Task<IActionResult> Post([FromBody] FeedbackRequest feedback)
        {
            try
            {
                var message = new MimeMessage();
                MailboxAddress from = new MailboxAddress(feedback.Name, feedback.FromEmail);
                MailboxAddress to = new MailboxAddress("Manpreet", feedback.ToEmail);
                message.To.Add(to);
                message.From.Add(from);
                message.Sender = from;
                message.ReplyTo.Add(from);

                message.Subject = feedback.Subject;

                message.Body = new TextPart("html")
                {
                    Text = feedback.Content
                };

                using (var client = new MailKit.Net.Smtp.SmtpClient())
                {
                    client.Connect(_smtpServer, _smtpPort);

                    client.AuthenticationMechanisms.Remove("XOAUTH2");

                    client.Authenticate("fig611ub@gmail.com", "otwvjrxqxeaqwrgy");

                    client.Send(message);
                    client.Disconnect(true);
                }
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

    }
}
