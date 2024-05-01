using System.IO.Compression;
using System.Security.Cryptography;
using System.Web;
using Amazon.S3;
using Amazon.S3.Model;
using FIGAPI.Data;
using FIGAPI.Models;
using FIGAPI.Services;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MimeKit;
using Newtonsoft.Json;
using QRCoder;

namespace FIGAPI.Controllers
{
    [EnableCors("AllowOrigin")]
    [Route("api/[controller]")]
    [ApiController]
    public class EventController : Controller
    {

        private readonly FigContext _dbContext;
        private readonly IStorageService _storageService;
        private readonly IConfiguration _config;
        private readonly string _smtpServer;
        private readonly int _smtpPort;
        private static readonly RandomNumberGenerator RandomGenerator = RandomNumberGenerator.Create();

        public EventController(FigContext dbContext, IConfiguration config, IStorageService storageService)
        {

            _dbContext = dbContext;
            _config = config;
            _storageService = storageService;
            _smtpServer = "smtp.gmail.com";
            _smtpPort = 587;
        }

        private static string GenerateRandomPassword(int length = 10)
        {
            const string validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()";

            var randomBytes = new byte[length];
            RandomGenerator.GetBytes(randomBytes);

            var chars = randomBytes.Select(b => validChars[b % validChars.Length]);
            return new string(chars.ToArray());
        }

        [HttpGet]
        [Route("events/{id}")]
        public IActionResult GetEvent(int id)
        {
            try
            {
                // Find the event with the specified id in the database
                var eventObj = _dbContext.Events.FirstOrDefault(e => e.EventId == id);

                if (eventObj == null)
                {
                    return NotFound();
                }

                return Ok(eventObj);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet]
        [Route("eventName/{id}")]
        public IActionResult GetName(int id)
        {
            try
            {
                // Find the event with the specified id in the database
                var eventObj = _dbContext.Events.FirstOrDefault(e => e.EventId == id);

                if (eventObj == null)
                {
                    return NotFound();
                }

                return Ok(eventObj.EventName);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        private async void Post(FeedbackRequest feedback)
        {
            try
            {
                var message = new MimeMessage();
                MailboxAddress from = new MailboxAddress("Consentize", "fig611ub@gmail.com");
                MailboxAddress to = new MailboxAddress(feedback.ToName, feedback.ToEmail);
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

            }
            catch (Exception ex)
            {
                throw (ex);
            }
        }


        [HttpPost]
        [Route("events")]
        public IActionResult CreateEvent([FromBody] Data.EventWrapper eventObj)
        {
            try
            {
                int lastEventId = _dbContext.Events.Any() ? _dbContext.Events.Max(e => e.EventId) : 0;
                eventObj.eventClass.EventId = lastEventId + 1;


                _dbContext.Events.Add(eventObj.eventClass);


                int lastBoothId = _dbContext.Booths.Any() ? _dbContext.Booths.Max(b => b.BoothId) : 0;
                int lastUserEventId = _dbContext.UserEvents.Any() ? _dbContext.UserEvents.Max(b => b.UserEventId) : 0;
                int lastUserId = _dbContext.Users.Any() ? _dbContext.Users.Max(b => b.UserId) : 0;
                List<string> designerEmails = eventObj.eventDesigners.Designers.Select(d => d.EmailAddress).ToList();
                List<Data.User> Artists = _dbContext.Users.Where(u => designerEmails.Contains(u.EmailAddress)).ToList();



                for (int i = 1; i <= eventObj.eventClass.Booths; i++)
                {
                    int lastBoothNo = _dbContext.Booths.Any(b => b.EventId == eventObj.eventClass.EventId) ? _dbContext.Booths.Where(b => b.EventId == eventObj.eventClass.EventId).Max(b => b.BoothNo) : 0;
                    Booth booth = new Booth();
                    booth.BoothId = lastBoothId + 1;
                    booth.EventId = eventObj.eventClass.EventId;
                    booth.BoothNo = lastBoothNo + 1;
                    booth.CheckinsCount = 0;
                    _dbContext.Booths.Add(booth);
                    lastBoothId++;

                    _dbContext.SaveChanges();
                }

                int boothCounter = 1;
                foreach (Designer designer in eventObj.eventDesigners.Designers)
                {
                    var Artist = Artists.Find(x => x.EmailAddress == designer.EmailAddress);
                    if (Artist == null)
                    {
                        string randomPassword = GenerateRandomPassword();
                        Data.User newUser = new Data.User();
                        newUser.Name = designer.Name;
                        newUser.EmailAddress = designer.EmailAddress;
                        newUser.UserId = lastUserId + 1;
                        newUser.ProfilePhotoUrl = "https://fig-bucket.s3.amazonaws.com/default.jpeg";
                        newUser.ProfilePhotoDescription= "default.jpeg";
                        newUser.Password = randomPassword;
                        _dbContext.Users.Add(newUser);
                        lastUserId++;

                        FeedbackRequest feedback = new FeedbackRequest();
                        feedback.ToEmail = designer.EmailAddress;
                        feedback.ToName = designer.Name;
                        feedback.Subject = "inital password for event platform";
                        feedback.Content = $"<b>Use this password to login to your account. Please update it if required using the forgot password link.</b><br><br><b>Password: {randomPassword}</b>";

                        Post(feedback);

                        UserEvent user = new UserEvent();
                        user.UserEventId = lastUserEventId + 1;
                        user.UserId = newUser.UserId;
                        user.EventId = eventObj.eventClass.EventId;
                        user.UserType = "Artist";
                        user.ApprovalStatus = "Y";
                        _dbContext.UserEvents.Add(user);
                        lastUserEventId++;

                        Booth booth = _dbContext.Booths.FirstOrDefault(b => b.BoothNo == boothCounter && b.EventId == eventObj.eventClass.EventId);
                        if (booth != null)
                        {
                            booth.DesignerId = newUser.UserId;
                            booth.DesignerName = newUser.Name;
                            boothCounter++;
                        }
                    }
                    else
                    {
                        UserEvent user = new UserEvent();
                        user.UserEventId = lastUserEventId + 1;
                        user.UserId = Artist.UserId;
                        user.EventId = eventObj.eventClass.EventId;
                        user.UserType = "Artist";
                        user.ApprovalStatus = "Y";
                        _dbContext.UserEvents.Add(user);
                        lastUserEventId++;

                        Booth booth = _dbContext.Booths.FirstOrDefault(b => b.BoothNo == boothCounter && b.EventId == eventObj.eventClass.EventId);
                        if (booth != null)
                        {
                            booth.DesignerId = Artist.UserId;
                            booth.DesignerName = Artist.Name;
                            boothCounter++;
                        }
                    }
                    _dbContext.SaveChanges();
                }
                _dbContext.SaveChanges();
                return CreatedAtAction(nameof(GetEvent), new { id = eventObj.eventClass.EventId }, eventObj.eventClass);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("createBoothQR")]
        public async Task<IActionResult> createBoothQR([FromBody] EventBooths eventBooths)
        {
            for (int boothId = 1; boothId <= eventBooths.boothCount; boothId++)
            {
                var qrCodeObject = new { eventId = eventBooths.eventId, boothId = boothId };


                var encodedData = HttpUtility.UrlEncode(JsonConvert.SerializeObject(qrCodeObject));

                var url = $"https://localhost:5001/attendee/event/{eventBooths.eventId}/booth/{boothId}?qrCode=${encodedData}";

                var qrGenerator = new QRCodeGenerator();
                var qrCodeData = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);
                var qrCode = new BitmapByteQRCode(qrCodeData);
                var qrCodeImage = qrCode.GetGraphic(20);

                using var memoryStream = new MemoryStream(qrCodeImage);

                var filename = $"{eventBooths.eventName}-booth-{boothId}.jpg";

                var s3Obj = new Models.S3Object()
                {
                    BucketName = "fig-bucket",
                    InputStream = memoryStream,
                    Name = filename
                };

                var cred = new AwsCredentials()
                {
                    AccessKey = _config["AwsConfiguration:AWSAccessKey"],
                    SecretKey = _config["AwsConfiguration:AWSSecretKey"]
                };

                var result = await _storageService.UploadFileAsync(s3Obj, cred, filename);

                if (result != null)
                {
                    var booth = _dbContext.Booths.FirstOrDefault(x => x.EventId == eventBooths.eventId && x.BoothNo == boothId);
                    booth.QrCodeUrl = "https://fig-bucket.s3.amazonaws.com/" + filename;

                    _dbContext.SaveChanges();
                }
            }
            return Ok();
        }

        [HttpGet]
        [Route("downloadQR/{key}")]
        public async Task<IActionResult> Get(string key)
        {
            var getObjectRequest = new GetObjectRequest
            {
                BucketName = "fig-bucket",
                Key = key
            };
            var cred = new AwsCredentials()
            {
                AccessKey = _config["AwsConfiguration:AWSAccessKey"],
                SecretKey = _config["AwsConfiguration:AWSSecretKey"]
            };

            var s3Client = new AmazonS3Client(cred.AccessKey, cred.SecretKey, Amazon.RegionEndpoint.USEast1);
            var response = await s3Client.GetObjectAsync(getObjectRequest);
            var stream = response.ResponseStream;
            return File(stream, response.Headers.ContentType, "your-image-filename");
        }


        [HttpPost("uploadFile")]
        public async Task<IActionResult> UploadFiles(List<IFormFile> files, [FromForm] List<string> description)
        {
            if (files == null || files.Count == 0)
            {
                return BadRequest("No files were provided for upload.");
            }

            if (description == null || description.Count != files.Count)
            {
                return BadRequest("Invalid number of types provided.");
            }

            var results = new List<S3ResponseDto>();

            for (int i = 0; i < files.Count; i++)
            {
                var file = files[i];
                var type = description[i];

                await using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);

                var fileExt = Path.GetExtension(file.FileName);
                var docName = description[i] + fileExt;

                var s3Obj = new Models.S3Object()
                {
                    BucketName = "fig-bucket",
                    InputStream = memoryStream,
                    Name = docName
                };

                var cred = new AwsCredentials()
                {
                    AccessKey = _config["AwsConfiguration:AWSAccessKey"],
                    SecretKey = _config["AwsConfiguration:AWSSecretKey"]
                };

                try
                {
                    var result = await _storageService.UploadFileAsync(s3Obj, cred, type);

                    if (result != null)
                    {
                        EventsArtifact artifact = new EventsArtifact();
                        int lastEventArtifactId = _dbContext.EventsArtifacts.Any() ? _dbContext.EventsArtifacts.Max(b => b.EventArtifactId) : 0;

                        artifact.Link = "https://fig-bucket.s3.amazonaws.com/" + docName;
                        artifact.EventArtifactId = lastEventArtifactId + 1;
                        artifact.EventId = int.Parse(description[i].Split('-')[0]);
                        artifact.LinkDescription = type;
                        _dbContext.EventsArtifacts.Add(artifact);
                        _dbContext.SaveChanges();

                        results.Add(result);



                    }
                }
                catch (Exception ex)
                {

                    return BadRequest($"An error occurred while uploading file: {ex.Message}");
                }
            }

            _dbContext.SaveChanges();
            return Ok(results);
        }



        [HttpGet]
        [Route("EventHistory")]
        public async Task<IActionResult> GetOccurredEvents()
        {
            try
            {
                var serverTimeZone = TimeZoneInfo.Local;

                var events = await _dbContext.Events.ToListAsync();

                var pastEvents = events
                    .Where(e => e.EventEndTime < TimeZoneInfo.ConvertTime(DateTime.UtcNow, serverTimeZone))
                    .OrderByDescending(e => e.EventEndTime)
                    .ToList();

                if (pastEvents.Count == 0)
                {
                    return NotFound();
                }

                return Ok(pastEvents);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet]
        [Route("upcomingEvents")]
        public async Task<IActionResult> GetUpcomingEvents()
        {
            try
            {
                var serverTimeZone = TimeZoneInfo.Local;

                var events = await _dbContext.Events.ToListAsync();

                var upcomingEvents = events
                .Where(e => e.EventStartTime > TimeZoneInfo.ConvertTime(DateTime.UtcNow, serverTimeZone))
                .OrderBy(e => e.EventStartTime)
                .ToList();
                if (upcomingEvents.Count == 0)
                {
                    return NotFound();
                }

                return Ok(upcomingEvents);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet]
        [Route("publishedEvents")]
        public async Task<IActionResult> GetPublishedEvents()
        {
            try
            {
                var serverTimeZone = TimeZoneInfo.Local;

                var events = await _dbContext.Events.ToListAsync();

                var publishedEvents = events
                .Where(e => e.PublishEvent == "Y" && e.CurrentEvent == "N" && e.EventStartTime > TimeZoneInfo.ConvertTime(DateTime.UtcNow, serverTimeZone))
                .OrderBy(e => e.EventStartTime)
                .ToList();
                if (publishedEvents.Count == 0)
                {
                    return NotFound();
                }

                return Ok(publishedEvents);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }


        [HttpPut]
        [Route("UpdateEvent/{eventId:int}")]
        public IActionResult UpdateEvent(int eventId, [FromBody] Data.Event eventObj)
        {
            try
            {
                var existingEvent = _dbContext.Events.FirstOrDefault(e => e.EventId == eventId);
                if (existingEvent == null)
                {
                    return NotFound($"Event with ID {eventId} not found");
                }

                existingEvent.EventName = eventObj.EventName;
                existingEvent.EventLocation = eventObj.EventLocation;
                existingEvent.EventStartTime = eventObj.EventStartTime;
                existingEvent.EventEndTime = eventObj.EventEndTime;
                existingEvent.TicketLink = eventObj.TicketLink;
                existingEvent.EventBio = eventObj.EventBio;
                existingEvent.CurrentEvent = eventObj.CurrentEvent;
                _dbContext.SaveChanges();




                return Ok(existingEvent);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }


        [HttpPost("editImages")]
        public async Task<IActionResult> EditImages(List<IFormFile> files, [FromForm] List<string> description)
        {

            if (files == null || files.Count == 0)
            {
                return BadRequest("No files were provided for upload.");
            }

            if (description == null || description.Count != files.Count)
            {
                return BadRequest("Invalid number of types provided.");
            }
            var eventId = int.Parse(description[0].Split('-')[0]);

            var existingArtifacts = await _dbContext.EventsArtifacts
                .Where(a => a.EventId == eventId)
                .ToListAsync();

            var existingDescriptions = existingArtifacts
                .Select(a => a.LinkDescription)
                .ToList();

            var descriptionsToDelete = existingDescriptions
                .Except(description)
                .ToList();

            var descriptionsToUpload = description
                .Except(existingDescriptions)
                .ToList();


            foreach (var descriptionDelete in descriptionsToDelete)
            {
                var artifactToDelete = existingArtifacts.Find(a => a.LinkDescription == descriptionDelete);

                if (artifactToDelete != null)
                {
                    var cred = new AwsCredentials()
                    {
                        AccessKey = _config["AwsConfiguration:AWSAccessKey"],
                        SecretKey = _config["AwsConfiguration:AWSSecretKey"]
                    };

                    var fileName = Path.GetFileName(new Uri(artifactToDelete.Link).LocalPath);

                    var result = await _storageService.DeleteFileAsync(fileName, cred);

                    if (result != null && result.StatusCode == 204)
                    {
                        _dbContext.EventsArtifacts.Remove(artifactToDelete);
                        await _dbContext.SaveChangesAsync();
                    }
                    else
                    {
                        return BadRequest($"Failed to delete file: {result.Message}");
                    }
                }
            }
            var results = new List<S3ResponseDto>();

            for (int i = 0; i < files.Count; i++)
            {
                var file = files[i];
                var desc = description[i];

                if (descriptionsToUpload.Contains(desc))
                {
                    await using var memoryStream = new MemoryStream();
                    await file.CopyToAsync(memoryStream);

                    var fileExt = Path.GetExtension(file.FileName);
                    var docName = desc + fileExt;

                    var s3Obj = new Models.S3Object()
                    {
                        BucketName = "fig-bucket",
                        InputStream = memoryStream,
                        Name = docName
                    };

                    var cred = new AwsCredentials()
                    {
                        AccessKey = _config["AwsConfiguration:AWSAccessKey"],
                        SecretKey = _config["AwsConfiguration:AWSSecretKey"]
                    };

                    try
                    {
                        var result = await _storageService.UploadFileAsync(s3Obj, cred, desc);


                        if (result != null)
                        {
                            EventsArtifact artifact = new EventsArtifact();
                            artifact = new EventsArtifact();
                            artifact.Link = "https://fig-bucket.s3.amazonaws.com/" + docName;
                            artifact.EventArtifactId = _dbContext.EventsArtifacts.Any() ? _dbContext.EventsArtifacts.Max(b => b.EventArtifactId) + 1 : 1;
                            artifact.EventId = eventId;

                            artifact.LinkDescription = desc;
                            _dbContext.EventsArtifacts.Add(artifact);
                            _dbContext.SaveChanges();


                            results.Add(result);
                        }
                    }
                    catch (Exception ex)
                    {
                        return BadRequest($"An error occurred while uploading file: {ex.Message}");
                    }
                }
            }

            _dbContext.SaveChanges();
            return Ok(results);
        }


        [HttpGet("/preview/{eventId}")]
        public async Task<ActionResult<EventArtists>> GetEventArtists(int eventId)
        {
            // Get the event details from the Events table
            var eventData = await _dbContext.Events.FindAsync(eventId);
            if (eventData == null)
            {
                return NotFound();
            }
            // Get the user IDs for all artists associated with the event from the User_Events table
            var artistUserEventIds = await _dbContext.UserEvents
                .Where(ue => ue.EventId == eventId && ue.UserType == "Artist" && ue.ApprovalStatus == "Y")
                .Select(ue => ue.UserId)
                .ToListAsync();

            // Get the details of all artists associated with the event from the Users table
            var artists = await _dbContext.Users
                .Where(u => artistUserEventIds.Contains(u.UserId))
                .Select(u => new ArtistBooth { Name = u.Name, EmailAddress = u.EmailAddress, DesignerId = u.UserId })
                .ToListAsync();

            // Get the booth details for all artists associated with the event from the Booth table
            var booths = await _dbContext.Booths
                .Where(b => b.EventId == eventId && artistUserEventIds.Contains(b.DesignerId.GetValueOrDefault()))
                .Select(b => new ArtistBooth { DesignerId = b.DesignerId.GetValueOrDefault(), BoothNumber = b.BoothNo, QRCodeURL = b.QrCodeUrl })
                .ToListAsync();

            // Join the artists and booths based on the DesignerId field
            var artistsWithBooths = artists
                .Join(booths, artist => artist.DesignerId, booth => booth.DesignerId, (artist, booth) => new ArtistBooth { Name = artist.Name, EmailAddress = artist.EmailAddress, BoothNumber = booth.BoothNumber, DesignerId = artist.DesignerId, QRCodeURL = booth.QRCodeURL })
                .ToList();


            var eventArtifacts = await _dbContext.EventsArtifacts
            .Where(a => a.EventId == eventId)
            .Select(a => new EventArtifact { Link = a.Link, LinkDescription = a.LinkDescription })
            .ToListAsync();


            // Combine the artist, booth, and artifact details into a list of ArtistBooth objects
            var eventArtists = new EventArtists
            {
                EventName = eventData.EventName,
                EventLocation = eventData.EventLocation,
                EventStartTime = eventData.EventStartTime,
                EventEndTime = eventData.EventEndTime,
                TicketLink = eventData.TicketLink,
                EventBio = eventData.EventBio,
                CurrentEvent = eventData.CurrentEvent,
                Booths = eventData.Booths,
                Artists = artistsWithBooths,
                Artifacts = eventArtifacts

            };

            // Return the EventArtists object
            return eventArtists;


        }









        [HttpGet("assetsLinks")]
        public ActionResult<IEnumerable<object>> GetLinks()
        {
            var links = new List<object>
            {
                new { AssetName = "Tickets", AssetURL = "https://fig-bucket.s3.amazonaws.com/tickets.png" },
                new { AssetName = "Quotes", AssetURL =  "https://fig-bucket.s3.amazonaws.com/quotes.svg"},
                new { AssetName = "Fig-Horizontal", AssetURL = "https://fig-bucket.s3.amazonaws.com/fig-official-horizontal.jpeg"},
                new { AssetName = "Feedback", AssetURL =  "https://fig-bucket.s3.amazonaws.com/feedback.jpeg"},
            };

            return Ok(links);
        }

        [HttpGet("unassigned-booths/{eventId}")]
        public IActionResult GetUnassignedBooths(int eventId)
        {
            var unassignedBoothNos = _dbContext.Booths
                .Include(b => b.Event)
                .Where(b => b.EventId == eventId && b.DesignerId == null && string.IsNullOrEmpty(b.DesignerName))
                .Select(b => b.BoothNo)
                .ToList();

            return Ok(unassignedBoothNos);
        }

        [HttpPost]
        [Route("editBoothAndArtists")]
        public async Task<IActionResult> CreateArtistBoothSaveAsync([FromBody] ArtistBoothSave artistBoothSave)
        {
            try
            {
                var existingEvent = _dbContext.Events.FirstOrDefault(e => e.EventId == artistBoothSave.EventId);
                if (existingEvent == null)
                {
                    return BadRequest("The specified event does not exist.");
                }

                // Check if the number of booths requested is less than or equal to the number of booths available
                if (artistBoothSave.TotalBooths >= existingEvent.Booths)
                {
                    int lastBoothNo = 0;
                    int lastBoothId = _dbContext.Booths.Any() ? _dbContext.Booths.Max(b => b.BoothId) : 0;
                    bool boothExists = _dbContext.Booths.Any(b => b.EventId == artistBoothSave.EventId);
                    if (boothExists)
                    {
                        lastBoothNo = _dbContext.Booths.Where(b => b.EventId == existingEvent.EventId).Max(b => b.BoothNo);
                    }


                    int boothsToAdd = (artistBoothSave.TotalBooths) - (existingEvent.Booths ?? 0);


                    for (int i = 0; i < boothsToAdd; i++)
                    {
                        Booth newBooth = new Booth();
                        newBooth.BoothId = lastBoothId + 1;
                        newBooth.EventId = artistBoothSave.EventId;
                        newBooth.DesignerId = null;
                        newBooth.DesignerName = null;
                        newBooth.BoothNo = lastBoothNo + 1;
                        _dbContext.Booths.Add(newBooth);

                        lastBoothId++;
                        lastBoothNo++;

                    }

                    existingEvent.Booths = artistBoothSave.TotalBooths;
                    _dbContext.SaveChanges();

                }
                if (artistBoothSave.ArtistBooths == null || artistBoothSave.ArtistBooths.Count == 0)
                {
                    return Ok(existingEvent);
                }


                var emails = artistBoothSave.ArtistBooths.Select(ab => ab.EmailAddress).ToList();
                var userIds = _dbContext.Users.Where(u => emails.Contains(u.EmailAddress)).Select(u => u.UserId).ToList();
                var boothUserIds = _dbContext.Booths.Where(b => b.EventId == artistBoothSave.EventId).Select(b => b.DesignerId).ToList();
                var toDeleteUserIds = boothUserIds.Except(userIds.Cast<int?>()).ToList();
                var userEventsToDelete = _dbContext.UserEvents.Where(ue => ue.EventId == artistBoothSave.EventId && toDeleteUserIds.Contains(ue.UserId));
                _dbContext.UserEvents.RemoveRange(userEventsToDelete);
                _dbContext.SaveChanges();






                foreach (var artistBooth in artistBoothSave.ArtistBooths)
                {
                    var userFound = _dbContext.Users.FirstOrDefault(u => u.EmailAddress == artistBooth.EmailAddress);

                    if (userFound != null)
                    {
                        var eventDesigner = _dbContext.Booths.FirstOrDefault(ed => ed.EventId == artistBoothSave.EventId && ed.DesignerId == userFound.UserId);
                        if (eventDesigner != null)
                        {
                            if (eventDesigner.BoothNo == artistBooth.BoothNumber)
                            {
                                continue;
                            }
                            else
                            {
                                eventDesigner.DesignerId = null;
                                eventDesigner.DesignerName = null;
                                _dbContext.SaveChanges();
                                var destinationBooth = _dbContext.Booths.FirstOrDefault(ed => ed.EventId == artistBoothSave.EventId && ed.BoothNo == artistBooth.BoothNumber);

                                if (destinationBooth != null)
                                {
                                    destinationBooth.DesignerId = userFound.UserId;
                                    destinationBooth.DesignerName = artistBooth.Name;
                                    _dbContext.SaveChanges();
                                }
                            }


                        }
                        else
                        {
                            var destinationBooth = _dbContext.Booths.FirstOrDefault(ed => ed.EventId == artistBoothSave.EventId && ed.BoothNo == artistBooth.BoothNumber);

                            if (destinationBooth != null)
                            {
                                destinationBooth.DesignerId = userFound.UserId;
                                destinationBooth.DesignerName = artistBooth.Name;
                                _dbContext.SaveChanges();


                            }
                        }
                    }

                    else
                    {
                        int lastUserEventId = _dbContext.UserEvents.Any() ? _dbContext.UserEvents.Max(b => b.UserEventId) : 0;
                        int lastUserId = _dbContext.Users.Any() ? _dbContext.Users.Max(b => b.UserId) : 0;

                        string randomPassword = GenerateRandomPassword();
                        Data.User newUser = new Data.User();
                        newUser.Name = artistBooth.Name;
                        newUser.EmailAddress = artistBooth.EmailAddress;
                        newUser.UserId = lastUserId + 1;
                        newUser.ProfilePhotoUrl = "https://fig-bucket.s3.amazonaws.com/default.jpeg";
                        newUser.ProfilePhotoDescription= "default.jpeg";
                        newUser.Password = randomPassword; //send mail
                        _dbContext.Users.Add(newUser);
                        lastUserId++;
                        await _dbContext.SaveChangesAsync();

                        FeedbackRequest feedback = new FeedbackRequest();
                        feedback.ToEmail = artistBooth.EmailAddress;
                        feedback.ToName = artistBooth.Name;
                        feedback.Subject = "inital password for event platform";
                        feedback.Content = $"<b>Use this password to login to your account. Please update it if required using the forgot password link.</b><br><br><b>Password: {randomPassword}</b>";

                        Post(feedback);

                        UserEvent user = new UserEvent();
                        user.UserEventId = lastUserEventId + 1;
                        user.UserId = newUser.UserId;
                        user.EventId = artistBoothSave.EventId;
                        user.UserType = "Artist";
                        user.ApprovalStatus = "Y";
                        _dbContext.UserEvents.Add(user);
                        lastUserEventId++;
                        await _dbContext.SaveChangesAsync();
                        var booth = await _dbContext.Booths.FirstOrDefaultAsync(b => b.EventId == artistBoothSave.EventId && b.BoothNo == artistBooth.BoothNumber);
                        if (booth != null)
                        {
                            booth.DesignerName = artistBooth.Name;
                            booth.DesignerId = newUser.UserId;
                            _dbContext.Entry(booth).State = EntityState.Modified;
                            await _dbContext.SaveChangesAsync();
                        }
                        await _dbContext.SaveChangesAsync();
                    }

                }
                if (artistBoothSave.TotalBooths < existingEvent.Booths)
                {
                    int boothsToRemove = (existingEvent.Booths ?? 0) - (artistBoothSave.TotalBooths);
                    var excessBooths = _dbContext.Booths
                        .Where(b => b.EventId == existingEvent.EventId)
                        .OrderByDescending(b => b.BoothNo)
                        .Take(boothsToRemove)
                        .ToList();

                    foreach (var booth in excessBooths)
                    {
                        _dbContext.Booths.Remove(booth);
                        _dbContext.SaveChanges();

                    }
                    existingEvent.Booths = artistBoothSave.TotalBooths;
                    _dbContext.SaveChanges();

                }

                return Ok(existingEvent);
            }

            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }

        }
        [HttpGet]
        [Route("events/{eventId}/unapproved-artists")]
        public IActionResult GetUnapprovedArtists(int eventId)
        {
            var unapprovedArtists = _dbContext.UserEvents
                .Where(ue => ue.UserType == "Artist" && ue.EventId == eventId && ue.ApprovalStatus == "P")
                .ToList();

            if (!unapprovedArtists.Any())
            {
                // Return an empty list with a 200 status code
                return Ok(new List<ArtistPortfolio>());
            }

            var artistPortfolios = new List<ArtistPortfolio>();

            foreach (var userEvent in unapprovedArtists)
            {
                var user = _dbContext.Users.FirstOrDefault(u => u.UserId == userEvent.UserId);

                if (user == null)
                {
                    continue;
                }

                var designerArtifacts = _dbContext.DesignerArtifacts
                    .Where(da => da.UserId == userEvent.UserId)
                    .Select(da => new DesignerArtifact
                    {
                        Link = da.Link,
                        LinkDescription = da.LinkDescription
                    })
                    .ToList();

                var artistPortfolio = new ArtistPortfolio
                {
                    UserId = userEvent.UserId,
                    Name = user.Name,
                    Email = user.EmailAddress,
                    PersonalBio = userEvent.PersonalBio,
                    Instagram = userEvent.Instagram,
                    Facebook = userEvent.Facebook,
                    Tiktok = userEvent.Tiktok,
                    Youtube = userEvent.Youtube,
                    PersonalWebsite = userEvent.PersonalWebsite,
                    DesignerArtifacts = designerArtifacts.Cast<object>().ToList()
                };

                artistPortfolios.Add(artistPortfolio);
            }

            return Ok(artistPortfolios);
        }


        [HttpPost]
        [Route("events/{eventId}/users/{userId}/approve/{boothNo}")]
        public IActionResult ApproveArtist(int eventId, int userId, int boothNo)
        {
            var userEvent = _dbContext.UserEvents.FirstOrDefault(ue => ue.EventId == eventId && ue.UserId == userId && ue.UserType == "Artist");
            if (userEvent == null)
            {
                return NotFound();
            }

            userEvent.ApprovalStatus = "Y";
            _dbContext.SaveChanges();

            var user = _dbContext.Users.FirstOrDefault(u => u.UserId == userId);
            if (user == null)
            {
                return NotFound();
            }

            var booth = _dbContext.Booths.FirstOrDefault(b => b.EventId == eventId && b.BoothNo == boothNo);
            if (booth == null)
            {
                return NotFound();
            }

            booth.DesignerId = userId;
            booth.DesignerName = user.Name;
            _dbContext.SaveChanges();

            return Ok();
        }


        [HttpPut]
        [Route("events/{eventId}/deny/{userId}")]
        public IActionResult DenyArtistApprovalStatus(int eventId, int userId)
        {
            var userEvent = _dbContext.UserEvents.FirstOrDefault(ue => ue.EventId == eventId && ue.UserId == userId && ue.UserType == "Artist" && ue.ApprovalStatus == "P");
            if (userEvent == null)
            {
                return NotFound();
            }

            userEvent.ApprovalStatus = "N";
            _dbContext.SaveChanges();

            return Ok();
        }

        [HttpGet("current-event")]
        public async Task<ActionResult<Event>> GetCurrentEvent()
        {
            try
            {
                var currentEvent = _dbContext.Events.FirstOrDefault(e => e.CurrentEvent == "Y");
                return Ok(currentEvent);
            }

            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
            }

        }

        [HttpGet("booth/{eventId}")]
        public async Task<ActionResult<Booth>> GetBooths(int eventId)
        {
            try
            {
                var booths = await _dbContext.Booths.Where(e => e.EventId == eventId).ToListAsync();
                return Ok(booths);
            }

            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
            }

        }

        [HttpGet("booth-QR-codes/{eventId}")]
        public async Task<IActionResult> DownloadImagesFromS3(int eventId)
        {
            var memoryStream = await GetZipStreamAsync(eventId);

            memoryStream.Seek(0, SeekOrigin.Begin);

            return File(memoryStream, "application/zip", $"QR-codes-{eventId}.zip");
        }

        private async Task<MemoryStream> GetZipStreamAsync(int eventId)
        {
            var listObjectsRequest = new ListObjectsV2Request
            {
                BucketName = "fig-bucket",
                Prefix = $"{eventId}-booth-"
            };

            var cred = new AwsCredentials()
            {
                AccessKey = _config["AwsConfiguration:AWSAccessKey"],
                SecretKey = _config["AwsConfiguration:AWSSecretKey"]
            };

            var s3Client = new AmazonS3Client(cred.AccessKey, cred.SecretKey, Amazon.RegionEndpoint.USEast1);
            var response = await s3Client.ListObjectsV2Async(listObjectsRequest);

            if (response.S3Objects.Count == 0)
            {
                throw new Exception($"No objects found in S3 bucket with prefix {eventId}-booth-");
            }

            var memoryStream = new MemoryStream();
            using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
            {
                foreach (var s3Object in response.S3Objects)
                {
                    using (var objectStream = await s3Client.GetObjectAsync(s3Object.BucketName, s3Object.Key))
                    {
                        var entryName = Path.GetFileName(s3Object.Key);
                        var entry = archive.CreateEntry(entryName, CompressionLevel.Optimal);
                        using (var entryStream = entry.Open())
                        {
                            await objectStream.ResponseStream.CopyToAsync(entryStream);
                        }
                    }
                }
            }

            return memoryStream;
        }



        [HttpPut("publish-event")]
        public async Task<ActionResult<Event>> PublishEvent([FromBody] Publish publish)
        {
            try
            {
                var currentEvent = _dbContext.Events.FirstOrDefault(e => e.CurrentEvent == "Y");
                var publishEvent = _dbContext.Events.FirstOrDefault(e => e.EventId == publish.eventId);

                if (publish.eventFlag == "P")
                {
                    publishEvent.PublishEvent = "Y";
                }
                else if (publish.eventFlag == "U")
                {
                    publishEvent.PublishEvent = "N";

                }
                else
                {
                    currentEvent.CurrentEvent = "N";
                    publishEvent.CurrentEvent = "Y";
                }


                _dbContext.SaveChanges();

                return Ok(publishEvent);
            }

            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
            }

        }

        [HttpPut("scan-booth")]
        public async Task<ActionResult<Event>> QRCodeScanner([FromBody] QRScanner model)
        {
            try
            {
                var boothvisited = _dbContext.EventBoothsVisiteds.FirstOrDefault(e => e.UserId == model.userId && e.BoothNo == model.boothId);

                if (boothvisited != null)
                {
                    string result = "Already Scanned";
                    return Ok(result);
                }
                else
                {
                    int lastBoothVisitedId = _dbContext.EventBoothsVisiteds.Any() ? _dbContext.EventBoothsVisiteds.Max(e => e.EventBoothVisitedId) : 0;
                    EventBoothsVisited eventBoothsVisited = new EventBoothsVisited();
                    eventBoothsVisited.EventBoothVisitedId = lastBoothVisitedId + 1;
                    eventBoothsVisited.EventId = model.eventId;
                    eventBoothsVisited.UserId = model.userId;
                    eventBoothsVisited.BoothNo = model.boothId;
                    _dbContext.EventBoothsVisiteds.Add(eventBoothsVisited);


                    var booth = _dbContext.Booths.FirstOrDefault(e => e.EventId == model.eventId && e.BoothNo == model.boothId);
                    booth.CheckinsCount += 1;
                    _dbContext.SaveChanges();
                    return Ok();
                }

                //return Ok(StatusCode(500));

            }

            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
            }

        }

        private async Task<IActionResult> SendMail(FeedbackRequest feedback)
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



        [HttpPost("QREdit")]
        public async Task<IActionResult> addQR([FromBody] QRCodeEdit qRCodeEdit)
        {
            for (int boothId = qRCodeEdit.start; boothId <= qRCodeEdit.end; boothId++)
            {
                var qrCodeObject = new { eventId = qRCodeEdit.eventId, boothId = boothId };


                var encodedData = HttpUtility.UrlEncode(JsonConvert.SerializeObject(qrCodeObject));

                var url = $"https://localhost:5001/attendee/event/{qRCodeEdit.eventId}/booth/{boothId}?qrCode=${encodedData}";

                var qrGenerator = new QRCodeGenerator();
                var qrCodeData = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);
                var qrCode = new BitmapByteQRCode(qrCodeData);
                var qrCodeImage = qrCode.GetGraphic(20);

                using var memoryStream = new MemoryStream(qrCodeImage);

                var filename = $"{qRCodeEdit.eventId}-booth-{boothId}.jpg";

                var s3Obj = new Models.S3Object()
                {
                    BucketName = "fig-bucket",
                    InputStream = memoryStream,
                    Name = filename
                };

                var cred = new AwsCredentials()
                {
                    AccessKey = _config["AwsConfiguration:AWSAccessKey"],
                    SecretKey = _config["AwsConfiguration:AWSSecretKey"]
                };

                var result = await _storageService.UploadFileAsync(s3Obj, cred, filename);

                if (result != null)
                {
                    var booth = _dbContext.Booths.FirstOrDefault(x => x.EventId == qRCodeEdit.eventId && x.BoothNo == boothId);
                    booth.QrCodeUrl = "https://fig-bucket.s3.amazonaws.com/" + filename;

                    _dbContext.SaveChanges();
                }
            }
            return Ok();
        }


        [HttpDelete("deleteQRCode")]
        public async Task<IActionResult> DeleteBoothImages([FromBody] QRCodeEdit qRCodeEdit)
        {
            // Step 2: Loop through booth numbers to be deleted
            for (int i = qRCodeEdit.end + 1; i <= qRCodeEdit.start; i++)
            {
                // Step 3: Delete the file from S3
                var cred = new AwsCredentials()
                {
                    AccessKey = _config["AwsConfiguration:AWSAccessKey"],
                    SecretKey = _config["AwsConfiguration:AWSSecretKey"]
                };
                var fileName = $"{qRCodeEdit.eventId}-booth-{i}.jpg";
                var result = await _storageService.DeleteFileAsync(fileName, cred);
                if (result == null)
                {
                    return BadRequest($"Failed to delete file: {result.Message}");
                }
            }

            return Ok();
        }

        [HttpGet("EventLogo/{eventId}")]
        public IActionResult GetEventLogoLink(int eventId)
        {
            var matchingArtifacts = _dbContext.EventsArtifacts
                .Where(a => a.EventId == eventId && a.LinkDescription == $"{eventId}-logo")
                .ToList();

            if (matchingArtifacts.Count == 0)
            {
                return NotFound();
            }

            // Assuming you want to return the link from the first matching artifact
            string logoLink = matchingArtifacts[0].Link;

            return Content(logoLink, "text/plain");
        }

    }






}









