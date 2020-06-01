import Athena = require("aws-sdk/clients/athena");

const AWS = require('aws-sdk');
const sts = new AWS.STS({ apiVersion: '2011-06-15' });

export function athenaForRole(roleArn: string, sessionName: string): Promise<Athena> {
    return sts.assumeRole({
        RoleArn: roleArn,
        RoleSessionName: sessionName
    }).promise.then(data => {
        return new AWS.Athena({
            region: 'eu-west-1',
            accessKeyId: data.Credentials.AccessKeyId,
            secretAccessKey: data.Credentials.SecretAccessKey,
            sessionToken: data.Credentials.SessionToken
        });
    })
}