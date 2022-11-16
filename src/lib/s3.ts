const AWS = require('aws-sdk');
import { GetObjectOutput } from 'aws-sdk/clients/s3';

const S3 = new AWS.S3();

export const getConfig = (stage: string) => {
    const Bucket = 'membership-private';
    const Key = `${stage}/ticker.conf.json`;

    return S3.getObject({
        Bucket,
        Key,
    })
        .promise()
        .then((result: GetObjectOutput) => {
            if (result.Body) {
                return Promise.resolve(result.Body.toString('utf-8'));
            } else {
                return Promise.reject(
                    new Error(`Missing Body in S3 response for ${Bucket}/${Key}`),
                );
            }
        })
        .catch(err => Promise.reject(`Failed to fetch S3 object ${Bucket}/${Key}: ${err}`));
}