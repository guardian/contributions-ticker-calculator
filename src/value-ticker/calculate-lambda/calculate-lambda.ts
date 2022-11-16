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

    TickerBucket: string;
    OutputFilename: string;
}

const stage = process.env.Stage;

interface Event {
    executionIds: QueryExecutionId[];
    Name: string;
}

export async function handler(event: Event): Promise<ManagedUpload.SendData> {
    console.log({event})
    const config: Config = await getConfig(stage);
    console.log({config})
    return reduceAndWrite(
        event.executionIds,
        reduce(config),
        config.TickerBucket,
        `${stage}/${config.OutputFilename}`,
        athena
    );
}

const reduce = (config: Config): QueryReduce => (queryResults: GetQueryResultsOutput[]) => {
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
