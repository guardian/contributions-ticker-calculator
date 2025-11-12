# ticker-calculator

Counts money or acquisitions during a campaign and outputs to an S3 file. Used by epic/banner and the support site landing page.

The calculated ticker value is output to the private S3 bucket `contributions-ticker`, with key `{STAGE}/{campaign_name}.json`.

**Access to ticker data:**
- For **support-dotcom-components** (SDC): The data is read directly from the private S3 bucket
- For **support-frontend**: The data is read directly from the private S3 bucket
- For **other services** (e.g., thrashers): Use the SDC endpoint at:
  - PROD: `https://contributions.guardianapis.com/ticker/{name}`
  - CODE: `https://contributions.code.dev-guardianapis.com/ticker/{name}`

The legacy Fastly-cached public URLs (e.g., `https://support.theguardian.com/ticker/US.json`) are no longer available.

[Architecture diagram](https://docs.google.com/drawings/d/1IoSxwMyxt8bDhRsZm-yX-B0nAaHD66anEnnM57A1gMk) (needs updating).

### Config

The lambda takes the name of a campaign as its input, to tell it which campaign config to use.

The stack defines a cloudwatch event for each campaign. The event is scheduled for every 15 minutes. Outside of campaigns, the schedule can be disabled manually from the AWS console.

The ticker config is loaded by the lambda from Parameter Store (key: `/ticker-calculator/{STAGE}/ticker-config`). The [example file](./src/ticker.conf.json) contains config for each campaign.

Setting up a new ticker campaign typically consists of manually setting the dates and goal amount in this Parameter Store config.

There are two types of ticker config:
1. Money
2. SupporterCount

### Data

#### Ticker type `Money`
The lambda queries two tables:
1. `fact_aquisition_event` for contributions. This table has live acquisitions data, and so contributions will be added to the ticker throughout the day.
2. `fact_holding_acquisition` for SupporterPlus and ThreeTier. This table is only updated daily, so these acquisitions will only be added to the ticker once a day. This is because the `amount` isn't available in the live `fact_aquisition_event` table.

We also count acquisitions twice if the billing period is monthly and two payments will be made during the campaign. This assumes no campaign runs for more than 2 months.

#### Ticker type `SupporterCount`
The lambda queries the `fact_aquisition_event` for single/recurring contributions, SupporterPlus and TierThree. This data is live.

### Testing

You can manually run the lambda in CODE by going to [the AWS console page](https://eu-west-1.console.aws.amazon.com/lambda/home?region=eu-west-1#/functions/ticker-calculator-CODE?tab=testing) and passing a campaign name as the input, e.g.
`"US"`

Note that the CODE lambda queries the CODE tables in BigQuery. If you need PROD data then you'll need to test with the PROD lambda.
