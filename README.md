# ticker-calculator

Counts money during a campaign and outputs to an S3 file. Used by epic/banner/thrashers.

The calculated ticker value is output to {bucket}/{STAGE}/{campaign_name}.json.

This file is cached behind fastly in both CODE and PROD, e.g https://support.theguardian.com/ticker/US.json.

### Config

The lambda takes the name of a campaign as its input, to tell it which campaign config to use.

The stack defines a cloudwatch event for each campaign.

The ticker config is loaded by the lambda from Parameter Store. This file contains config for each campaign [src/ticker.conf.json](see example).
