import { handler } from './query-lambda';
let AWS = require('aws-sdk');

/**
 * For testing locally:
 * `yarn run query-local`
 */

AWS.config = new AWS.Config();
AWS.config.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
AWS.config.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
AWS.config.sessionToken = process.env.AWS_SESSION_TOKEN;
AWS.config.region = "eu-west-1";

async function run() {
    await handler({ Name: 'US_2022' })
        .then(result => console.log(`Result: ${JSON.stringify(result)}`))
        .catch(err => console.log(`Error: ${err}`))
}

run();
