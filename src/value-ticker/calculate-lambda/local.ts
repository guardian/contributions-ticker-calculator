import { handler } from './calculate-lambda';
let AWS = require('aws-sdk');

/**
 * For testing locally:
 * `yarn run calculate-local <execution id>,<execution id>,...`
 */

AWS.config = new AWS.Config();
AWS.config.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
AWS.config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
AWS.config.sessionToken = process.env.AWS_SESSION_TOKEN;
AWS.config.region = "eu-west-1";

async function run(ids: string) {
    await handler(ids.split(','))
        .then(result => console.log(`Result: ${JSON.stringify(result)}`))
        .catch(err => console.log(`Error: ${err}`))
}

run(process.argv[2]);
