import {GuApiGatewayWithLambdaByPath, GuApiLambda} from "@guardian/cdk";
import {GuAlarm} from "@guardian/cdk/lib/constructs/cloudwatch";
import type {GuStackProps} from "@guardian/cdk/lib/constructs/core";
import {GuStack} from "@guardian/cdk/lib/constructs/core";
import {GuLambdaFunction} from "@guardian/cdk/lib/constructs/lambda";
import type {App} from "aws-cdk-lib";
import {Duration} from "aws-cdk-lib";
import {
  CfnBasePathMapping,
  CfnDomainName,
  Cors,
} from "aws-cdk-lib/aws-apigateway";
import {ComparisonOperator, Metric} from "aws-cdk-lib/aws-cloudwatch";
import {Effect, ManagedPolicy, Policy, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {Runtime} from "aws-cdk-lib/aws-lambda";
import {CfnRecordSet} from "aws-cdk-lib/aws-route53";

export interface ContributionsTickerCalculatorAPIProps extends GuStackProps {
  stack: string;
  stage: string;
  certificateId: string;
  domainName: string;
  hostedZoneId: string;
  acquisitionEventsBucket: string;
}

export class ContributionsTickerCalculatorAPI extends GuStack {
  constructor(scope: App, id: string, props: ContributionsTickerCalculatorAPIProps) {
    super(scope, id, props);


    // ---- Miscellaneous constants ---- //
    const isProd = this.stage === 'PROD';
    const app = "contributions-ticker-calculator";
    const commonEnvironmentVariables = {
      App: app,
      Stack: this.stack,
      Stage: this.stage,
    };


    // ---- API-triggered lambdas ---- //

    const queryLambdaAmount = new GuApiLambda(this, `${app}-query-lambda-amount`, {
      description:
          'A lambda that queries tha value of the contributions for a campaigm',
      functionName: `${app}-query-lambda-amount-${this.stage}`,
      fileName: `${app}-query-lambda-amount.zip`,
      handler: './src/value-ticker/query-lambda-amount/query-lambda-amount.handler',
      runtime: Runtime.NODEJS_18_X,
      memorySize: 128,
      timeout: Duration.seconds(300),
      ...commonEnvironmentVariables,
      // Create an alarm
      monitoringConfiguration: {
        http5xxAlarm: {tolerated5xxPercentage: 5},
        snsTopicName: 'conversion-dev',
      },
      app: app,
      api: {
        id: `${app}-query-lambda-amount-${this.stage}`,
        restApiName: `${app}-query-lambda-amount-${this.stage}`,
        description: 'API Gateway for Ticker Amount created by CDK',
        proxy: true,
        deployOptions: {
          stageName: this.stage,
        },
        defaultMethodOptions: {
          apiKeyRequired: false,
        },
      },
    });


    const queryLambdaSupporterCount = new GuApiLambda(this, `${app}-query-lambda-supporter-count`, {
      description:
          'A lambda that queries the supporter  count for a campaign',
      functionName: `${app}-query-lambda-amount-${this.stage}`,
      fileName: `${app}-query-lambda-supporter-count.zip`,
      handler: './src/value-ticker/query-lambda-supporter-count/query-lambda-supporter-count.handler',
      runtime: Runtime.NODEJS_18_X,
      memorySize: 128,
      timeout: Duration.seconds(300),
      ...commonEnvironmentVariables,
      // Create an alarm
      monitoringConfiguration: {
        http5xxAlarm: {tolerated5xxPercentage: 5},
        snsTopicName: 'conversion-dev',
      },
      app: app,
      api: {
        id: `${app}-query-lambda-amount-${this.stage}`,
        restApiName: `${app}-query-lambda-amount-${this.stage}`,
        description: 'API Gateway for Ticker Supporter Count created by CDK',
        proxy: true,
        deployOptions: {
          stageName: this.stage,
        },
        defaultMethodOptions: {
          apiKeyRequired: false,
        },
      },
    });


    // ---- API gateway ---- //
    const contributionsTickerCalculatorAPI = new GuApiGatewayWithLambdaByPath(this, {
      app,
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: ["Content-Type"],
      },
      monitoringConfiguration: {noMonitoring: true},
      targets: [
        {
          path: "/ticker-supporter-count",
          httpMethod: "GET",
          lambda: queryLambdaSupporterCount,
        },
        {
          path: "/ticker-amount",
          httpMethod: "GET",
          lambda: queryLambdaAmount,
        },
      ],
    })


    // ---- Alarms ---- //
    new GuAlarm(this, 'ApiGateway4XXAlarmContributionsTickerCalculatorAPI', {
      app,
      alarmName: `contributions-ticker-calculator-${this.stage} API gateway 4XX response`,
      alarmDescription: "Contributions Ticker Calculator API received an invalid request",
      evaluationPeriods: 1,
      threshold: 6,
      actionsEnabled: isProd,
      snsTopicName: "conversion-dev",
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      metric: new Metric({
        metricName: "4XXError",
        namespace: "AWS/ApiGateway",
        statistic: "Sum",
        period: Duration.seconds(900),
        dimensionsMap: {
          ApiName: `contributions-ticker-calculator-${this.stage}`,
        }
      }),
    });

    new GuAlarm(this, 'ApiGateway5XXAlarmContributionsTickerCalculatorAPI', {
      app,
      alarmName: `contributions-ticker-calculator-${this.stage} 5XX error`,
      alarmDescription: `Contributions Ticker Calculator API-${this.stage} exceeded 1% 5XX error rate`,
      evaluationPeriods: 1,
      threshold: 1,
      actionsEnabled: isProd,
      snsTopicName: "conversion-dev",
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      metric: new Metric({
        metricName: "5XXError",
        namespace: "AWS/ApiGateway",
        statistic: "Sum",
        period: Duration.seconds(60),
        dimensionsMap: {
          ApiName: `contributions-ticker-calculator-${this.stage}`,
        }
      }),
    });


    // ---- DNS ---- //
    const certificateArn = `arn:aws:acm:eu-west-1:${this.account}:certificate/${props.certificateId}`;
    const cfnDomainName = new CfnDomainName(this, 'DomainName', {
      domainName: props.domainName,
      regionalCertificateArn: certificateArn,
      endpointConfiguration: {
        types: ['REGIONAL'],
      },
    });

    new CfnBasePathMapping(this, 'BasePathMapping', {
      domainName: cfnDomainName.ref,
      restApiId: contributionsTickerCalculatorAPI.api.restApiId,
      stage: contributionsTickerCalculatorAPI.api.deploymentStage.stageName,
    });

    new CfnRecordSet(this, 'DNSRecord', {
      name: props.domainName,
      type: 'CNAME',
      hostedZoneId: props.hostedZoneId,
      ttl: '120',
      resourceRecords: [cfnDomainName.attrRegionalDomainName],
    });


    // ---- Apply policies ---- //


    const cloudwatchLogsInlinePolicy = (lambda: GuLambdaFunction, idPrefix: string): Policy => {
      return new Policy(this, `${idPrefix}-cloudwatch-logs-inline-policy`, {
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents"
            ],
            resources: [
              `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/${lambda.functionName}:log-stream:*`
            ]
          }),
        ],
      })
    }

    const queryLambdaAmountS3InlinePolicy: Policy = new Policy(this, "contributions-ticker-calculator-query-lambda-amount-s3-inline-policy", {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["s3:GetObject"],
          resources: [
            `arn:aws:s3::*:membership-dist/*`,
            `arn:aws:s3::*:membership-private/${this.stage}/ticker.conf.json`
          ],
        }),
      ],
    })

    const acquistionEventsBucketInlinePolicy: Policy = new Policy(this, "acquistion-events-bucket-inline-policy", {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["s3:*"],
          resources: [
            `arn:aws:s3::*:acquisition-events/*`,
            `arn:aws:s3::*:acquisition-events/${this.stage}`
          ]
        }),
      ],
    })

    const acquistionEventsOutputInlinePolicy: Policy = new Policy(this, "acquistion-events-output-inline-policy", {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["s3:*"],
          resources: [
            `arn:aws:s3::*:acquisition-events-output/*`,
            `arn:aws:s3::*:acquisition-events-output`
          ]
        }),
      ],
    })


    const apiGatewayTriggeredLambdaFunctions: GuLambdaFunction[] = [
      queryLambdaAmount,
      queryLambdaSupporterCount,
    ]

    apiGatewayTriggeredLambdaFunctions.forEach((l: GuLambdaFunction) => {
      l.role?.attachInlinePolicy(queryLambdaAmountS3InlinePolicy);
      l.role?.attachInlinePolicy(acquistionEventsBucketInlinePolicy);
      l.role?.attachInlinePolicy(acquistionEventsOutputInlinePolicy);
    })


    queryLambdaAmount.role?.attachInlinePolicy(cloudwatchLogsInlinePolicy(queryLambdaAmount, "query-amount"));
    queryLambdaSupporterCount.role?.attachInlinePolicy(cloudwatchLogsInlinePolicy(queryLambdaSupporterCount, "query-supporter-count"));

    // queryLambdaAmount.role?.attachInlinePolicy(queryLambdaAmountS3InlinePolicy);
    // queryLambdaAmount.role?.attachInlinePolicy(acquistionEventsBucketInlinePolicy);
    // queryLambdaAmount.role?.attachInlinePolicy(acquistionEventsOutputInlinePolicy);
    // queryLambdaSupporterCount.role?.attachInlinePolicy(queryLambdaAmountS3InlinePolicy);
    // queryLambdaSupporterCount.role?.attachInlinePolicy(acquistionEventsBucketInlinePolicy);
    // queryLambdaSupporterCount.role?.attachInlinePolicy(acquistionEventsOutputInlinePolicy);

  }
}