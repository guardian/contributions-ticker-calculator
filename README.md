# contributions-ticker-calculator

## Setting up a campaign
[See here](docs/campaign-setup.md)

## Architecture
This project consists of an AWS State Machine with two lambdas. It is run on a cloudwatch schedule.
[It currently only supports one campaign at a time.](#why-only-one-campaign-at-a-time)

The first lambda queries the acquisition_events Athena table. The second lambda gets the query result, calculates the ticker value, and writes it to S3.

The acquisition_events data comes from the live [acquisitions-stream](https://github.com/guardian/contributions-platform/tree/master/acquisitions-stream).

![ticker-architecture](https://user-images.githubusercontent.com/5122968/51033127-3e8bb180-159a-11e9-81a6-4bfed3c328d5.JPG)


## Notes

#### Running manually
Trigger a one-off run from the Step Functions console page (`contributions-ticker-calculator-{STAGE}`).

#### Result file
The calculated ticker value is output to `{bucket}/{STAGE}/ticker.json`.
This file is behind fastly in both CODE and PROD (https://support.theguardian.com/ticker.json).

#### Why only one campaign at a time?
- It's configured using cloudformation parameters, and we only have one stack,
- It outputs a single number to a single file in S3.

If we find that we need more than one concurrent ticker then this can be changed.