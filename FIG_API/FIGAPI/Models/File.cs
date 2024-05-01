public class UploadFileModel
{
    public IEnumerable<IFormFile> Files { get; set; }
    public string EventName { get; set; }
    public string Type { get; set; }
}