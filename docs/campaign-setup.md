# Setting up a campaign

The current design only allows for one campaign at a time.

## Create the partitions

Athena partitions _must_ be created before the campaign begins. The lambda performs queries using partitions to save costs. You can generate the SQL for creating the partitions using [this script](https://github.com/guardian/contributions-platform/blob/master/acquisitions-stream/scripts/generate-query-to-add-partitions.sh). We need to generate partions for the `acquisition_events_prod` (or `_code`) table, which is backed by s3 files at `acquistion-events/PROD` (or `/CODE`). An example of running the script might look like:

```sh
./generate-query-to-add-partitions.sh \
  --date-from 2021-11-01 \
  --date-to 2021-11-05 \
  --s3-prefix s3://acquisition-events/CODE \
  --table acquisition_events_code \
```

Which should output the followeing:

```sql
ALTER TABLE acquisition_events_code ADD
PARTITION (acquisition_date='2021-11-01') location 's3://acquisition-events/CODE/2021/11/01/'
PARTITION (acquisition_date='2021-11-02') location 's3://acquisition-events/CODE/2021/11/02/'
PARTITION (acquisition_date='2021-11-03') location 's3://acquisition-events/CODE/2021/11/03/'
PARTITION (acquisition_date='2021-11-04') location 's3://acquisition-events/CODE/2021/11/04/'
PARTITION (acquisition_date='2021-11-05') location 's3://acquisition-events/CODE/2021/11/05/'
;

```

Which can be copied into the Athena console and ran. This will create a partition for each day of the campaign. Any days without a partition will not be included in the calculation. If we don't know the end date of the campaign we can always generate more partitions if needed at a later time, we just need to make sure we generate them before they are required.

## Updating the ticker

To update the ticker, we need to update the CloudFormation parameters. The steps involved in that are:

1. Login to AWS through Membership Janus
2. Navigate to CloudFormation
3. Search for `contributions-ticker-calculator`
4. Select code or prod version
5. Click the update button
6. 'Use current template' + click the 'next button'
7. Update the parameters as per below

### CloudFormation parameters

| Parameter       | Mandatory? |                                                                                       |
| --------------- | ---------- | ------------------------------------------------------------------------------------- |
| `StartDate`     | Y          | YYYY-MM-DD                                                                            |
| `EndDate`       | Y          | YYYY-MM-DD                                                                            |
| `InitialAmount` | Y          | If we receive a contribution before the campaign begins then it can be added on here. |
| `GoalAmount`    | Y          | E.g. 1250000                                                                          |
| `Currency`      | Y          | E.g. USD                                                                              |
| `CountryCode`   | Y          | E.g. US                                                                               |
| `CampaignCode`  | N          | Filter contributions by a campaign code                                               |

To switch the cloudwatch schedule on and begin calculating the ticker value, set `ScheduleState` to `ENABLED`.

By default it will run every 15 minutes, though this can be configured with the `CronExpression` parameter.

Remember to set `ScheduleState` to `DISABLED` after the campaign ends to avoid unnecessary costs.
