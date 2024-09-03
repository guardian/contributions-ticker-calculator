import { GuScheduledLambda } from '@guardian/cdk';
import type { GuStackProps } from '@guardian/cdk/lib/constructs/core';
import { GuStack, GuStringParameter } from '@guardian/cdk/lib/constructs/core';
import type { App } from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import { Schedule } from 'aws-cdk-lib/aws-events';
import { PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

const AppName = 'ticker-calculator';
const TickerBucket = 'contributions-ticker';

export class TickerCalculator extends GuStack {
	constructor(scope: App, id: string, props: GuStackProps) {
		super(scope, id, props);

		const scheduleState = new GuStringParameter(this, 'ScheduleState', {
			description: 'The state of the schedule',
			default: 'ENABLED',
			allowedValues: ['ENABLED', 'DISABLED'],
		});

		const scheduleRules =
			scheduleState.valueAsString === 'ENABLED'
				? [
						{
							schedule: Schedule.rate(Duration.minutes(15)),
						},
					]
				: [];

		const role = new Role(this, 'query-lambda-role', {
			// Set the name of the role rather than using an autogenerated name.
			// This is because if the ARN is too long then it breaks the authentication request to GCP
			roleName: `${AppName}-${this.stage}`,
			assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
		});
		role.addToPolicy(
			// Logging permissions
			new PolicyStatement({
				actions: [
					'logs:CreateLogGroup',
					'logs:CreateLogStream',
					'logs:PutLogEvents',
				],
				resources: ['*'],
			}),
		);
		role.addToPolicy(
			// Permission to create the ticker output file in S3
			new PolicyStatement({
				actions: ['s3:*'],
				resources: [
					`arn:aws:s3::*:${TickerBucket}/*`,
					`arn:aws:s3::*:${TickerBucket}`,
				],
			}),
		);
		role.addToPolicy(
			// Permission to read config from Parameter Store
			new PolicyStatement({
				actions: ['ssm:GetParameter'],
				resources: [
					`arn:aws:ssm:${this.region}:${this.account}:parameter/ticker-calculator/${this.stage}/gcp-wif-credentials-config`,
					`arn:aws:ssm:${this.region}:${this.account}:parameter/ticker-calculator/${this.stage}/ticker-config`,
				],
			}),
		);

		new GuScheduledLambda(this, 'TickerCalculator', {
			app: AppName,
			functionName: `${AppName}-${this.stage}`,
			runtime: Runtime.NODEJS_20_X,
			handler: 'lambda.handler',
			fileName: `${AppName}.zip`,
			rules: scheduleRules,
			role,
			monitoringConfiguration:
				this.stage === 'PROD'
					? {
							toleratedErrorPercentage: 0,
							snsTopicName: 'alarms-handler-topic-PROD',
						}
					: { noMonitoring: true },
		});
	}
}
