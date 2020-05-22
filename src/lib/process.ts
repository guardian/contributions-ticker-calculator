import {
    GetQueryExecutionOutput,
    GetQueryResultsOutput,
    QueryExecutionId,
    QueryExecutionState
} from "aws-sdk/clients/athena";
import {QueryFailedError, QueryPendingError} from "./errors";
import {ManagedUpload} from "aws-sdk/lib/s3/managed_upload";

const AWS = require('aws-sdk');
const athena = new AWS.Athena({region: 'eu-west-1'});
const s3 = new AWS.S3();

// The function for producing the output data from Athena query results
export type QueryReduce = (queryResults: GetQueryResultsOutput[]) => Object

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

function getExecutionResult(executionId: string): Promise<GetQueryResultsOutput> {
    return athena.getQueryResults({ QueryExecutionId: executionId }).promise();
}

function writeToS3(data: Object, bucket: string, key: string): Promise<ManagedUpload.SendData> {
    return s3.upload({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(data),
        ACL: 'public-read',
        CacheControl: 'max-age=300'
    }).promise();
}

/**
 * Checks the status of the Athena query executions, applies the QueryReduce function to the results, and writes
 * to the S3 file.
 */
export function reduceAndWrite(
    executionIds: QueryExecutionId[],
    reduce: QueryReduce,
    outputBucket: string,
    outputKey: string,
): Promise<ManagedUpload.SendData> {
    return Promise.all(executionIds.map(getExecutionState))
        .then((completionResults: QueryExecutionState[]) => Promise.all(completionResults.map(checkExecutionState)))
        .then(() => Promise.all(executionIds.map(getExecutionResult)))
        .then(reduce)
        .then(result => writeToS3(result, outputBucket, outputKey))
}
