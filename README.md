# ticker-calculator

Counts money during a campaign and outputs to an S3 file. Used by epic/banner/thrashers.

The calculated ticker value is output to {bucket}/{STAGE}/{campaign_name}.json.

This file is cached behind fastly in both CODE and PROD, e.g https://support.theguardian.com/ticker/US.json.

### Config

The lambda takes the name of a campaign as its input, to tell it which campaign config to use.

The stack defines a cloudwatch event for each campaign.

The ticker config is loaded by the lambda from Parameter Store. This file contains config for each campaign [src/ticker.conf.json](see example).

### Data

The lambda queries two tables:
1. `fact_aquisition_event` for contributions. This table has live acquisitions data, and so contributions will be added to the ticker throughout the day.
2. `fact_holding_acquisition` for SupporterPlus and ThreeTier. This table is only updated daily, so these acquisitions will only be added to the ticker once a day. This is because the `amount` isn't available in the live `fact_aquisition_event` table.

We also count acquisitions twice if the billing period is monthly and two payments will be made during the campaign. This assumes no campaign runs for more than 1 month.

### Testing

You can manually run the lambda in CODE by going to [the AWS console page](https://eu-west-1.console.aws.amazon.com/lambda/home?region=eu-west-1#/functions/ticker-calculator-CODE?tab=testing) and passing a campaign name as the input, e.g.
`"US"`

Note that the CODE lambda queries the CODE tables in BigQuery. If you need PROD data then you'll need to test with the PROD lambda.
