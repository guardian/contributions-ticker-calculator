# value-ticker

Counts money during a campaign and outputs to an S3 file. Used by epic/banner/thrashers.

### Architecture

This stack consists of a state machine with two lambdas. It is triggered by scheduled cloudwatch events.

The first lambda makes one or more Athena queries. The second lambda waits for the query results, then calculates the ticker value and writes it to S3.

[Architecture diagram here](https://docs.google.com/drawings/d/1T2qvai9SJnNcdd0-9Nj39NnHNyAAK8IY58qm6nYfhuY/edit)

This state machine uses the `acquisition_events` data, which comes from the live [acquisitions-stream](https://github.com/guardian/contributions-platform/tree/master/acquisitions-stream).

Events from this stream are processed by the [acquisitions-firehose-transformer](https://github.com/guardian/support-frontend/tree/main/support-lambdas/acquisitions-firehose-transformer) and written to S3, from where they can be queried using Athena.

The calculated ticker value is output to `{bucket}/{STAGE}/{campaign_name}.json`.

This file is cached behind fastly in both CODE and PROD, e.g [https://support.theguardian.com/ticker/US_2022.json](https://support.theguardian.com/ticker/US_2022.json).

### Config

The state machine takes a `Name` parameter as an input, to tell it which campaign name to run for.

The cloudformation.yaml defines a cloudwatch event for each campaign.

The ticker config is loaded by the lambdas from a `ticker.conf.json` file in S3. This file contains config for each campaign ([see example](ticker.conf.json)).

### Running manually

Trigger a one-off run from the Step Functions console page (`contributions-ticker-calculator-{STAGE}`).

The state machine takes a `Name` parameter, e.g:

`{ "Name": "US_2022" }`
