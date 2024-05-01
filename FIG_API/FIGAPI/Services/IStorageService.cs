using FIGAPI.Models;

namespace FIGAPI.Services;

public interface IStorageService
{
    Task<S3ResponseDto> UploadFileAsync(S3Object obj, AwsCredentials awsCredentialsValues, string type);
    Task<S3ResponseDto> DeleteFileAsync(string fileName, AwsCredentials awsCredentialsValues);
}