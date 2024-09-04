import * as AWS from 'aws-sdk';
import type { ManagedUpload } from "aws-sdk/lib/s3/managed_upload";

function writeToS3(data: Record<string, unknown>, bucket: string, key: string): Promise<ManagedUpload.SendData> {
    const s3 = new AWS.S3();

    return s3.upload({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(data),
        ACL: 'public-read',
        CacheControl: 'max-age=300'
    }).promise();
}
