using FIGAPI.Data;
using FIGAPI.Models;
using FIGAPI.Services;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FIGAPI.Controllers
{
    [EnableCors("AllowOrigin")]
    [Route("api/[controller]")]
    [ApiController]
    public class ArtistController : Controller
    {

        private readonly FigContext _dbContext;
        private readonly IStorageService _storageService;
        private readonly IConfiguration _config;

        public ArtistController(FigContext dbContext, IConfiguration config, IStorageService storageService)
        {

            _dbContext = dbContext;
            _config = config;
            _storageService = storageService;
        }
        [HttpPost("artistRegister")]
       public async Task<ActionResult> registerForEventAsync([FromBody] RegistrationData registrationData)

        {
            var registration = registrationData.Registration;
             var artistPortfolio = registrationData.ArtistPortfolio;
            int lastUserEventId = _dbContext.UserEvents.Any() ? _dbContext.UserEvents.Max(b => b.UserEventId) : 0;
            UserEvent user = new UserEvent();
            user.UserEventId = lastUserEventId + 1;
            user.UserId = registration.UserId;
            user.EventId = registration.EventId;
            user.UserType = "Artist";
            user.ApprovalStatus = "P";
            user.Instagram= artistPortfolio.Instagram;
            user.Facebook=artistPortfolio.Facebook;
            user.Twitter=artistPortfolio.Twitter;
            user.Tiktok= artistPortfolio.Tiktok;
            user.PersonalBio = artistPortfolio.PersonalBio;
            user.PersonalWebsite = artistPortfolio.PersonalWebsite;
            _dbContext.UserEvents.Add(user);
            await _dbContext.SaveChangesAsync();

            lastUserEventId++;
            return Ok();
        }


       


        [HttpPut]
        [Route("users/update-portfolio/{userId}/{eventId}")]
        public async Task<IActionResult> UpdateUser(int userId, int eventId, [FromBody] ArtistPortfolio artistPortfolio)
        {
            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound();
            }

            var userEvent = await _dbContext.UserEvents.FirstOrDefaultAsync(ue => ue.UserId == userId && ue.EventId == eventId);
            if (userEvent == null)
            {
                return NotFound();
            }

            user.Name = artistPortfolio.Name;
            userEvent.PersonalBio = artistPortfolio.PersonalBio;
            userEvent.Instagram = artistPortfolio.Instagram;
            userEvent.Facebook = artistPortfolio.Facebook;
            userEvent.Tiktok = artistPortfolio.Tiktok;
            userEvent.Youtube = artistPortfolio.Youtube;
             userEvent.Twitter = artistPortfolio.Twitter;
            userEvent.PersonalWebsite = artistPortfolio.PersonalWebsite;

            await _dbContext.SaveChangesAsync();

            return Ok(userEvent);
        }

        

        [HttpPost("uploadArtistFiles")]
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

                var s3Obj = new S3Object()
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
                        DesignerArtifact artifact = new DesignerArtifact();
                        int lastDesignerArtifactId = _dbContext.DesignerArtifacts.Any() ? _dbContext.DesignerArtifacts.Max(b => b.DesignerArtifactId) : 0;

                        artifact.Link = "https://fig-bucket.s3.amazonaws.com/" + docName;
                        artifact.DesignerArtifactId = lastDesignerArtifactId + 1;
                        string[] parts = description[i].Split('-');
                        int eventId = int.Parse(parts[0]);
                        int designerId = int.Parse(parts[1]);
                        artifact.EventId = eventId;
                        artifact.UserId = designerId;
                        artifact.LinkDescription = type;
                        _dbContext.DesignerArtifacts.Add(artifact);
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

        [HttpPost("editArtistImages")]
        public async Task<IActionResult> EditImages(List<IFormFile> files, [FromForm] List<string> description)
        {   if (files == null || files.Count == 0)
            {
                return BadRequest("No files were provided for upload.");
            }

            if (description == null || description.Count != files.Count)
            {
                return BadRequest("Invalid number of types provided.");
            }
             
            string[] parts = description[0].Split('-');

            int eventId = int.Parse(parts[0]);
            int artistId = int.Parse(parts[1]);

           var existingArtifacts = await _dbContext.DesignerArtifacts
            .Where(a => a.UserId == artistId && a.EventId == eventId)
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
                        _dbContext.DesignerArtifacts.Remove(artifactToDelete);
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

                    var s3Obj = new S3Object()
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
                            DesignerArtifact artifact = new DesignerArtifact();
                            artifact.Link = "https://fig-bucket.s3.amazonaws.com/" + docName;
                            artifact.DesignerArtifactId = _dbContext.DesignerArtifacts.Any() ? _dbContext.DesignerArtifacts.Max(b => b.DesignerArtifactId) + 1 : 1;
                            artifact.UserId = artistId;
                            artifact.EventId = eventId;
                            artifact.LinkDescription = desc;
                            _dbContext.DesignerArtifacts.Add(artifact);
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



        [HttpGet("upcoming-events-except-user/{userId}")]
        public IActionResult GetUpcomingEventsExceptUser(int userId)
        {
            var now = DateTime.UtcNow;
            var upcomingEvents = _dbContext.Events
                .Where(e => e.EventStartTime > now && e.EventEndTime > now)
                .OrderBy(e => e.EventStartTime);


            var associatedEventIds = _dbContext.UserEvents
                .Where(ue => ue.UserId == userId)
                .Select(ue => ue.EventId)
                .ToList();

            var unassociatedEvents = upcomingEvents
                .Where(e => !associatedEventIds.Contains(e.EventId))
                .ToList();

            return Ok(unassociatedEvents);
        }

        [HttpGet]
        [Route("/users/{userId}")]
        public IActionResult GetUser(int userId)
        {
            var user = _dbContext.Users.FirstOrDefault(u => u.UserId == userId);
            if (user == null)
                {
                        return NotFound();
                }
                var userEvent = _dbContext.UserEvents
    .Where(ue => ue.UserId == userId && ue.UserType == "Artist")
    .OrderByDescending(ue => ue.UserEventId)
    .FirstOrDefault();

            if (userEvent == null)
            {
                return Ok(new { Name = user.Name, Email = user.EmailAddress });
            }

            var designerArtifacts = _dbContext.DesignerArtifacts
                .Where(da => da.UserId == userId && da.EventId == userEvent.EventId)
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
                Twitter = userEvent.Twitter,
                PersonalWebsite = userEvent.PersonalWebsite,

                DesignerArtifacts = designerArtifacts.Cast<object>().ToList()
            };

            return Ok(artistPortfolio);
        }

        [HttpGet("userevents/{userId}")]
        public IActionResult GetUserEvents(int userId)
        {
            var artistEvents = _dbContext.UserEvents
                .Where(ue => ue.UserId == userId)
                .Select(ue => new
                {
                    ue.EventId,
                    ue.ApprovalStatus,
                    ue.UserType
                })
                .ToList();


            var eventDetails = new List<dynamic>();
            foreach (var userEvent in artistEvents)
            {
                var eventDetail = _dbContext.Events
                    .Where(e => e.EventId == userEvent.EventId)
                    .Select(e => new
                    {
                        e.EventName,
                        e.EventLocation,
                        e.EventStartTime,
                        e.EventEndTime,
                        e.EventBio
                    })
                    .FirstOrDefault();

                int? boothNo = null;
                if (userEvent.UserType == "Artist")
                {
                    var boothDetail = _dbContext.Booths
                        .Where(b => b.EventId == userEvent.EventId && b.DesignerId == userId)
                        .Select(b => new
                        {
                            b.BoothNo,
                        })
                        .FirstOrDefault();
                    boothNo = boothDetail?.BoothNo;
                }

                eventDetails.Add(new
                {
                    userEvent.EventId,
                    userEvent.ApprovalStatus,
                    userEvent.UserType,
                    eventDetail.EventName,
                    eventDetail.EventLocation,
                    eventDetail.EventStartTime,
                    eventDetail.EventEndTime,
                    eventDetail.EventBio,
                    BoothNo = boothNo,
                });
            }

            return Ok(eventDetails);
        }
        [HttpGet("artistsForEvent/{id}")]
        public async Task<ActionResult<IEnumerable<ArtistEventInfo>>> GetArtistsforEvent(int id)
        {
            
            var userEvents = await _dbContext.UserEvents
    .Where(ue => ue.EventId == id && ue.UserType == "Artist")
    .ToListAsync();


            
            var userInfos = new List<ArtistEventInfo>();
            foreach (var userEvent in userEvents)
            {
                var user = await _dbContext.Users.FindAsync(userEvent.UserId);
                if (user != null)
                {
                    userInfos.Add(new ArtistEventInfo
                    {
                        Name = user.Name,
                        Email = user.EmailAddress,
                        ApprovalStatus = userEvent.ApprovalStatus
                    });
                }
            }

            return userInfos;
        }

[HttpGet]
[Route("users/{userId}/events/{eventId}/portfolio")]
public IActionResult GetCurrentEventPortfolio(int userId, int eventId)
{
    var userEvent = _dbContext.UserEvents.FirstOrDefault(ue => ue.UserId == userId && ue.EventId == eventId && ue.UserType == "Artist");
    if (userEvent == null)
    {
        return NotFound();
    }

    var user = _dbContext.Users.FirstOrDefault(u => u.UserId == userId);
    if (user == null)
    {
        return NotFound();
    }

       var designerArtifacts = _dbContext.DesignerArtifacts
        .Where(da => da.UserId == userId && da.EventId == eventId)
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
        ProfilePhotoUrl = user.ProfilePhotoUrl,
        PersonalBio = userEvent.PersonalBio,
        Instagram = userEvent.Instagram,
        Facebook = userEvent.Facebook,
        Tiktok = userEvent.Tiktok,
        Youtube = userEvent.Youtube,
        Twitter = userEvent.Twitter,
        PersonalWebsite = userEvent.PersonalWebsite,

        DesignerArtifacts = designerArtifacts.Cast<object>().ToList()
    };

    return Ok(artistPortfolio);
}






        

   










        }
    }
