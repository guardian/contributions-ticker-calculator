# Setting up a campaign

## Creating a new ticker campaign

### 1. Add a cloudwatch event
In the [cloudformation.yaml](../src/value-ticker/cloudformation.yaml), add a scheduled event for the new campaign name. E.g. for `US_2022`:

```
  ScheduleUS:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub contributions-ticker-calculator-schedule-US_2022-${Stage}
      ScheduleExpression: !Sub cron(${CronExpression})
      State: !Ref ScheduleState
      Targets:
        - Arn: !Ref StateMachine
          RoleArn: !GetAtt TriggerExecutionRole.Arn
          Id: !GetAtt StateMachine.Name
          Input: '{ "Name": "US_2022" }'
```

This is a code change and requires a riff-raff deploy.

### 2. Update the ticker config

Config is defined in an S3 file in the membership-private bucket, under `/{STAGE}/ticker.conf.json`.

| Parameter       | Mandatory? |                                                                                       |
| --------------- | ---------- | ------------------------------------------------------------------------------------- |
| `StartDate`     | Y          | YYYY-MM-DD                                                                            |
| `EndDate`       | Y          | YYYY-MM-DD                                                                            |
| `InitialAmount` | Y          | If we receive a contribution before the campaign begins then it can be added on here. |
| `GoalAmount`    | Y          | E.g. 1250000                                                                          |
| `Currency`      | Y          | E.g. USD                                                                              |
| `CountryCode`   | Y          | E.g. US                                                                               |
| `CampaignCode`  | N          | Filter contributions by a campaign code                                               |


## Enabling the state machine
To switch the cloudwatch schedules on and begin calculating the ticker value, set `ScheduleState` to `ENABLED`.

By default it will run every 15 minutes, though this can be configured with the `CronExpression` parameter.

Remember to set `ScheduleState` to `DISABLED` after the campaign ends to avoid unnecessary costs.

## Athena

No action is required to make Athena work for a new campaign.

Athena relies on partitions to know where to query in S3. This is automatically taken care of by the Epic Super Mode state machine here: https://github.com/guardian/support-analytics/blob/main/super-mode-calculator/src/lambdas/partition/queries.ts#L34