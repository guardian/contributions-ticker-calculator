import {Config} from "../config";
import {ManagedUpload} from "aws-sdk/lib/s3/managed_upload";
import {GetQueryExecutionOutput, GetQueryResultsOutput, QueryExecutionState} from "aws-sdk/clients/athena";
import {QueryFailedError, QueryPendingError} from "./errors";

const AWS = require('aws-sdk');
const config = new Config();
const athena = new AWS.Athena({region: 'eu-west-1'});
const s3 = new AWS.S3();

/**
 * Checks the status of the Athena query executions, combines the results, and writes to the public ticker file.
 */
export async function handler(executionIds: string[]): Promise<ManagedUpload.SendData> {
    return Promise.all(executionIds.map(getExecutionState))
        .then((completionResults: QueryExecutionState[]) => Promise.all(completionResults.map(checkExecutionState)))
        .then(() => Promise.all(executionIds.map(getExecutionResult)))
        .then((amounts: number[]) => amounts.reduce((sum, v) => sum + v))
        .then((result: number) => result + config.InitialAmount)
        .then((result: number) => updateTicker(config.TickerBucket, result))
}

function getExecutionState(executionId: string): Promise<QueryExecutionState> {
    return athena.getQueryExecution({QueryExecutionId: executionId}).promise()
        .then((getQueryExecutionOutput: GetQueryExecutionOutput) => {
            console.log(`Execution ${executionId} has status: ${JSON.stringify(getQueryExecutionOutput)}`);

            return getQueryExecutionOutput.QueryExecution.Status.State;
        })
}

function checkExecutionState(state: QueryExecutionState): Promise<QueryExecutionState> {
    if (state === 'QUEUED' || state === 'RUNNING') return Promise.reject(new QueryPendingError());
    else if (state === 'FAILED' || state === 'CANCELLED') return Promise.reject(new QueryFailedError());
    else return Promise.resolve(state)
}

function getExecutionResult(executionId: string): Promise<number> {
    return athena.getQueryResults({ QueryExecutionId: executionId }).promise()
        .then((getQueryResultsOutput: GetQueryResultsOutput) =>
            new Promise((resolve, reject) => {
                const value = parseFloat(getQueryResultsOutput.ResultSet.Rows[1].Data[0].VarCharValue);

                if (value) resolve(value);
                else reject(`Missing result in query output: ${JSON.stringify(getQueryResultsOutput)}`)
            })
        )
}

function updateTicker(tickerBucket: string, value: number): Promise<ManagedUpload.SendData> {
    return s3.upload({
        Bucket: tickerBucket,
        Key: 'ticker.txt',
        Body: value.toString(),
        ACL: 'public-read'
    }).promise();
}
