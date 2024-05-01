using FIGAPI.Models;
using Amazon.S3;
using Amazon.S3.Transfer;
using Amazon.Runtime;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;

namespace FIGAPI.Services
{
    public class StorageService : IStorageService
    {
        private readonly IConfiguration _config;

        public StorageService(IConfiguration config)
        {
            _config = config;
        }

        public async Task<S3ResponseDto> UploadFileAsync(FIGAPI.Models.S3Object  obj, AwsCredentials awsCredentials, string type)
        {

            var credentials = new BasicAWSCredentials(awsCredentials.AccessKey, awsCredentials.SecretKey);

            var config = new AmazonS3Config()
            {
                RegionEndpoint = Amazon.RegionEndpoint.USEast1,
                ServiceURL = "https://s3.amazonaws.com"
            };

            var response = new S3ResponseDto();
            try
            {
                var uploadRequest = new TransferUtilityUploadRequest()
                {
                    InputStream = obj.InputStream,
                    Key = obj.Name,
                    BucketName = obj.BucketName,
                    CannedACL = S3CannedACL.NoACL
                };

                uploadRequest.Metadata.Add("x-amz-meta-description", type);

                using var client = new AmazonS3Client(credentials, config);

                var transferUtility = new TransferUtility(client);

                await transferUtility.UploadAsync(uploadRequest);

                response.StatusCode = 201;
                response.Message = $"{obj.Name} has been uploaded sucessfully";
            }
            catch (AmazonS3Exception s3Ex)
            {
                response.StatusCode = (int)s3Ex.StatusCode;
                response.Message = s3Ex.Message;
            }
            catch (Exception ex)
            {
                response.StatusCode = 500;
                response.Message = ex.Message;
            }

            return response;
        }

        public async Task<S3ResponseDto> DeleteFileAsync(string fileName, AwsCredentials awsCredentials)
        {
            var credentials = new BasicAWSCredentials(awsCredentials.AccessKey, awsCredentials.SecretKey);

            var config = new AmazonS3Config()
            {
                RegionEndpoint = Amazon.RegionEndpoint.USEast1,
                ServiceURL = "https://s3.amazonaws.com"
            };

            var response = new S3ResponseDto();
            try
            {
                var deleteRequest = new DeleteObjectRequest
                {
                    BucketName = "fig-bucket",
                    Key = fileName
                };

                using var client = new AmazonS3Client(credentials, config);

                var deleteResponse = await client.DeleteObjectAsync(deleteRequest);

                response.StatusCode = (int)deleteResponse.HttpStatusCode;
                response.Message = $"{fileName} has been deleted successfully";
            }
            catch (AmazonS3Exception s3Ex)
            {
                response.StatusCode = (int)s3Ex.StatusCode;
                response.Message = s3Ex.Message;
            }
            catch (Exception ex)
            {
                response.StatusCode = 500;
                response.Message = ex.Message;
            }

    return response;
}



        
    }
}
