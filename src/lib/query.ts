import {
    QueryExecutionId,
    StartQueryExecutionInput,
    StartQueryExecutionOutput
} from "aws-sdk/clients/athena";

const AWS = require('aws-sdk');
const athena = new AWS.Athena({region: 'eu-west-1'});

export class Query {
    query: string;
    token: string;

    constructor(q: string, name: string) {
        this.query = q;
        this.token = `${name}_${new Date().toISOString()}`;
    }
}

/**
 * Executes Athena queries and returns the execution IDs
 */
export function executeQueries(queries: Query[], athenaOutputBucket: string, schemaName: string): Promise<QueryExecutionId[]> {
    const executeQuery = (query: Query): Promise<StartQueryExecutionOutput> => {
        const params: StartQueryExecutionInput = {
            QueryString: query.query,
            ResultConfiguration: {
                OutputLocation: `s3://${athenaOutputBucket}`,
            },
            ClientRequestToken: query.token,
            QueryExecutionContext: {
                Database: schemaName
            }
        };

        return athena.startQueryExecution(params).promise()
    };

    return Promise.all(queries.map(executeQuery))
        .then((results: StartQueryExecutionOutput[]) => results.map(result => result.QueryExecutionId))
}
