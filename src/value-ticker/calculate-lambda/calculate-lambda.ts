import {ManagedUpload} from "aws-sdk/lib/s3/managed_upload";
import {
    GetQueryResultsOutput,
    QueryExecutionId,
} from "aws-sdk/clients/athena";
import {QueryReduce, reduceAndWrite} from "../../lib/process";
import {getConfig} from "../../lib/s3";

const AWS = require('aws-sdk');
const athena = new AWS.Athena({region: 'eu-west-1'});

class Config {
    InitialAmount: number;
    GoalAmount: number;
}

const stage = process.env.Stage;
const tickerBucket = process.env.TickerBucket

export interface CalculateLambdaEvent {
    ExecutionIds: QueryExecutionId[];
    Name: string;
    Query: string;
}

export async function handler(event: CalculateLambdaEvent): Promise<ManagedUpload.SendData> {
    console.log({event});
    const config: Config = (await getConfig(stage))[event.Name];
    if (event.Query === "AmountQuery") {
        return reduceAndWrite(
            event.ExecutionIds,
            reduce(config),
            tickerBucket,
            `${stage}/${event.Name}/Amount.json`,
            athena
        );
    }
    else {
        return reduceAndWrite(
            event.ExecutionIds,
            reduce(config),
            tickerBucket,
            `${stage}/${event.Name}/SupporterCount.json`,
            athena
        );
    }

}

const reduce = (config: Config): QueryReduce => (queryResults: GetQueryResultsOutput[]) => {
    const amounts: number[] = queryResults.map((result: GetQueryResultsOutput) => {
        const value = Math.round(parseFloat(result.ResultSet.Rows[1].Data[0].VarCharValue));
        if (value) return value;
        else {
            //This will happen if there are no results for this particular query
            console.log(`No results for query: ${JSON.stringify(result)}`);
            return 0
        }
    });

    const total = Math.round(amounts.reduce((sum, v) => sum + v) + config.InitialAmount);

    return {
        total,
        goal: config.GoalAmount
    };
};
