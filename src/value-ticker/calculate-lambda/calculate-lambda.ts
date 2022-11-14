import {ManagedUpload} from "aws-sdk/lib/s3/managed_upload";
import {
    GetQueryResultsOutput,
    QueryExecutionId,
} from "aws-sdk/clients/athena";
import {QueryReduce, reduceAndWrite} from "../../lib/process";

const AWS = require('aws-sdk');
const athena = new AWS.Athena({region: 'eu-west-1'});

class Config {
    Stage: string = process.env.Stage;

    InitialAmount: number = parseInt(process.env.InitialAmount);
    GoalAmount: number = parseInt(process.env.GoalAmount);

    TickerBucket: string = process.env.TickerBucket;
    OutputFilename: string = process.env.OutputFilename
}

const config = new Config();

export async function handler(executionIds: QueryExecutionId[]): Promise<ManagedUpload.SendData> {
    return reduceAndWrite(
        executionIds,
        reduce,
        config.TickerBucket,
        `${config.Stage}/${config.OutputFilename}`,
        athena
    );
}

const reduce: QueryReduce = (queryResults: GetQueryResultsOutput[]) => {
    const amounts: number[] = queryResults.map((result: GetQueryResultsOutput) => {
        const value = parseFloat(result.ResultSet.Rows[1].Data[0].VarCharValue);
        if (value) return value;
        else {
            //This will happen if there are no results for this particular query
            console.log(`No results for query: ${JSON.stringify(result)}`);
            return 0
        }
    });

    const total = amounts.reduce((sum, v) => sum + v) + config.InitialAmount;

    return {
        total,
        goal: config.GoalAmount
    };
};
