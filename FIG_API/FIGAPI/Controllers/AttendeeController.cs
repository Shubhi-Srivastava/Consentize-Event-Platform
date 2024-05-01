using Microsoft.AspNetCore.Mvc;
using FIGAPI.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Cors;
using FIGAPI.Models;

namespace FIGAPI.Controllers
{
    [EnableCors("AllowOrigin")]
    [Route("api/[controller]")]
    [ApiController]
    public class AttendeeController : Controller
    {

        private readonly FigContext _dbContext;

        public AttendeeController(FigContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet("UserEvents/{userId}")]
        public async Task<ActionResult<IEnumerable<Event>>> GetAttendeeEvents(int userId)
        {
            using (var db = new FigContext())
            {
                var eventIds = await db.EventBoothsVisiteds
                    .Where(b => b.UserId == userId)
                    .Select(b => b.EventId)
                    .Distinct()
                    .ToListAsync();

                var events = await db.Events
                .Where(e => eventIds.Contains(e.EventId))
                .ToListAsync();

                return events;
            }
        }

        [HttpGet("Events/{userId}")]
        public async Task<ActionResult<IEnumerable<Event>>> GetEvents(int userId)
        {
            using (var db = new FigContext())
            {
                var now = DateTime.UtcNow;
                var events = db.Events
                            .Where(e => e.EventStartTime > now && e.EventEndTime > now)
                            .OrderBy(e => e.EventStartTime)
                            .GroupJoin(db.UserEvents.Where(ue => ue.UserId == userId),
                                e => e.EventId, ue => ue.EventId,
                                (e, ues) => new
                                {
                                    Event = e,
                                    UserEvents = ues
                                })
                            .SelectMany(e => e.UserEvents.DefaultIfEmpty(),
                                (e, ue) => new
                                {
                                    EventId = e.Event.EventId,
                                    EventName = e.Event.EventName,
                                    EventLocation = e.Event.EventLocation,
                                    EventStartTime = e.Event.EventStartTime,
                                    EventEndTime = e.Event.EventEndTime,
                                    TicketLink = e.Event.TicketLink,
                                    EventBio = e.Event.EventBio,
                                    ApprovalStatus = ue == null ? null : ue.ApprovalStatus,
                                    UserType = ue == null ? null : ue.UserType
                                })
                            .ToList();

                return Ok(events);

            }
        }

        [HttpPut("user/{userId}/event/{eventId}/notification")]
        public async Task<IActionResult> UpdateNotificationStatus(int userId, int eventId, [FromBody] NotificationStatus newNotificationStatus)
        {
            var userEvent = await _dbContext.UserEvents.FirstOrDefaultAsync(x => x.UserId == userId && x.EventId == eventId);

            if (userEvent == null)
            {
                return NotFound();
            }

            userEvent.NotificationStatus = newNotificationStatus.notification;
            await _dbContext.SaveChangesAsync();

            return Ok();
        }

        [HttpPut("user/{userId}/event/{eventId}/wallet")]
        public async Task<IActionResult> UpdateWalletAddress(int userId, int eventId, [FromBody] WalletAddress wallet)
        {
            var userEvent = await _dbContext.UserEvents.FirstOrDefaultAsync(x => x.UserId == userId && x.EventId == eventId);

            if (userEvent == null)
            {
                return NotFound();
            }

            userEvent.DigitatWallet = wallet.wallet;
            await _dbContext.SaveChangesAsync();

            return Ok();
        }

        [HttpGet("user/{userId}/event/{eventId}")]
        public async Task<ActionResult<UserEvent>> GetAttendee(int userId, int eventId)
        {
            using (var db = new FigContext())
            {
                var user = db.UserEvents.FirstOrDefault(x => x.UserId == userId && x.EventId == eventId);

                return user;
            }
        }
        [HttpPost("attendeeRegister")]
        public async Task<ActionResult> registerForEventAsync([FromBody] EventRegistration registration)
        {
            int lastUserEventId = _dbContext.UserEvents.Any() ? _dbContext.UserEvents.Max(b => b.UserEventId) : 0;
            UserEvent user = new UserEvent();
            user.UserEventId = lastUserEventId + 1;
            user.UserId = registration.UserId;
            user.EventId = registration.EventId;
            user.UserType = "Attendee";
            user.ApprovalStatus = "Y";
            user.NotificationStatus="N";
            _dbContext.UserEvents.Add(user);
            await _dbContext.SaveChangesAsync();

            lastUserEventId++;

            return Ok();
        }

        [HttpPost("SignUpForEvent/{userType}")]
        public async Task<IActionResult> SignUpForUpcomingEvent([FromBody] Status userEventObj, string userType)
        {
            try
            {

                var userEvent = new UserEvent();

                int usereventid = _dbContext.UserEvents.Any() ? _dbContext.UserEvents.Max(b => b.UserEventId) : 0;

                var userevent = _dbContext.UserEvents.FirstOrDefaultAsync(x => x.UserId == userEventObj.UserId && x.EventId == userEventObj.EventId);

                if (userevent.Result == null)
                {

                    userEvent.UserEventId = usereventid + 1;
                    userEvent.UserId = userEventObj.UserId;
                    userEvent.EventId = userEventObj.EventId;
                    userEvent.ApprovalStatus = userType == "Artist" ? "P" : "Y";
                    userEvent.DigitatWallet = null;
                    userEvent.UserType = userType;
                    userEvent.NotificationStatus = "N";

                    _dbContext.UserEvents.Add(userEvent);
                }
                else
                {
                    return Ok("Already Signed Up");
                }

                await _dbContext.SaveChangesAsync();

                return Ok(userEvent);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }
        [HttpGet]
        [Route("api/participationDetails/{userId}/{eventId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetParticipationDetails(int userId, int eventId)
        {
            var result = new List<object>();
            var eventsVisited = await _dbContext.EventBoothsVisiteds
                .Where(v => v.UserId == userId && v.EventId == eventId)
                .ToListAsync();

            var userEvent = await _dbContext.UserEvents
                .Where(ue => ue.UserId == userId && ue.EventId == eventId)
                .FirstOrDefaultAsync();

            if (userEvent == null)
            {
                // User did not participate in the event
                return NotFound();
            }

            var digitalGoodiesReceived = userEvent.DigitalGoodiesReceived;

            foreach (var eventVisited in eventsVisited)
            {
                var boothsVisited = await _dbContext.EventBoothsVisiteds
                    .Where(v => v.UserId == userId && v.EventId == eventId )
                    .Select(v => v.BoothNo.ToString())
                    .ToListAsync();

                var eventData = new
                {
                    DigitalGoodiesReceived = digitalGoodiesReceived,
                    VisitedBooths = boothsVisited
                };

                result.Add(eventData);
            }

            return Ok(result);
        }


       [HttpPut("DigitalGoodies")]
        public async Task<IActionResult> UpdateDigitalGoodiesReceived([FromBody] DigitalGoodiesUpdate dto)
        {
            var userEvent = await _dbContext.UserEvents
                .FirstOrDefaultAsync(ue => ue.UserId == dto.UserId && ue.EventId == dto.EventId);

            if (userEvent == null)
            {
                return NotFound();
            }

            userEvent.DigitalGoodiesReceived = dto.DigitalGoodiesReceived;

            _dbContext.UserEvents.Update(userEvent);
            await _dbContext.SaveChangesAsync();

            return Ok();
}









}
}