# Setting up a campaign

The current design only allows for one campaign at a time.

## Create the partitions

Athena partitions _must_ be created before the campaign begins. The lambda performs queries using partitions to save costs.
You can generate the SQL for creating the partitions using [this script](https://github.com/guardian/contributions-platform/blob/master/acquisitions-stream/scripts/generate-query-to-add-partitions.sh), and run the query from the Athena console page.

Create a partition for each day of the campaign. Any days without a partition will not be included in the calculation.

## Start here (step-by-step instructions for updating the ticker)

1. Login to AWS through Membership Janus
2. Navigate to CloudFormation
3. Search for contributions-ticker-calculator
4. Select code or prod version
5. Click the update button
6. 'Use current template' + click the 'next button'
7. Update the parameters per below

## Update the cloudformation parameters of the contributions-ticker-calculator stack

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
