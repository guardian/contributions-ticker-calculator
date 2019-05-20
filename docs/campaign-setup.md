## Setting up a campaign

The current design only allows for one campaign at a time.

### Create the partitions
Athena partitions *must* be created before the campaign begins. The lambda performs queries using partitions to save costs.
You can generate the SQL for creating the partitions using [this script](https://github.com/guardian/contributions-platform/blob/master/acquisitions-stream/scripts/generate-query-to-add-partitions.sh), and run the query from the Athena console page.

Create a partition for each day of the campaign. Any days without a partition will not be included in the calculation.

### Update the cloudformation parameters of the contributions-ticker-calculator stack
| Parameter       | Mandatory? |                                                                                       |
|-----------------|------------|---------------------------------------------------------------------------------------|
| `StartDate`     | Y          | YYYY-MM-DD                                                                              |
| `EndDate`       | Y          | YYYY-MM-DD                                                                              |
| `InitialAmount` | Y          | If we receive a contribution before the campaign begins then it can be added on here. |
| `GoalAmount`    | Y          |                                                                                       |
| `Currency`      | Y          | E.g. 'USD'                                                                            |
| `CountryCode`   | Y          | E.g. 'US'                                                                             |
| `CampaignCode`  | N          | Filter contributions by a campaign code                                               |

To switch the cloudwatch schedule on and begin calculating the ticker value, set `ScheduleState` to `ENABLED`.

By default it will run every 15 minutes, though this can be configured with the `CronExpression` parameter.

Remember to set `ScheduleState` to `DISABLED` after the campaign ends to avoid unnecessary costs.


### Notes

#### Running manually
Trigger a one-off run from the Step Functions console page (`contributions-ticker-calculator-{STAGE}`).

#### Result file
The calculated ticker value is output to `{bucket}/{STAGE}/ticker.json`.
This file is behind fastly in both CODE and PROD.

#### Why only one campaign at a time?
- It's configured using cloudformation parameters, and we only have one stack,
- It outputs a single number to a single file in S3.

If we find that we need more than one concurrent ticker then this can be changed.