import {Config} from './config';
import {
    GetQueryExecutionOutput,
    GetQueryResultsOutput,
    StartQueryExecutionInput,
    StartQueryExecutionOutput
} from "aws-sdk/clients/athena";
import moment = require("moment");
import {Moment} from "moment";
import {getQueries, Query} from "./queries";

const AWS = require('aws-sdk');
const config = new Config();
const athena = new AWS.Athena({region: 'eu-west-1'});

export async function handler(): Promise<number> {
    const startDateTime: Moment = moment(config.StartDateTime);
    const endDateTime: Moment = moment(config.EndDateTime);

    console.log(`Getting total for period ${config.StartDateTime}-${config.EndDateTime} and country codes ${config.CountryCodesString}`);

    const queries = getQueries(startDateTime, endDateTime, config.CountryCodesString);

    return Promise.all(queries.map(executeQuery))
        .then((amounts: number[]) => amounts.reduce((sum, v) => sum + v))
        .then((result: number) => result + config.InitialAmount)
}

function executeQuery(query: Query): Promise<number> {
    const params: StartQueryExecutionInput = {
        QueryString: query.query,
        ResultConfiguration: {
            OutputLocation: `s3://${config.AthenaOutputBucket}`,
        },
        ClientRequestToken: query.token,
        QueryExecutionContext: {
            Database: config.SchemaName
        }
    };

    return athena.startQueryExecution(params).promise()
        .then((startQueryExecutionOutput: StartQueryExecutionOutput) =>
            //TODO - this isn't great, should we use 2 lambdas? Step functions?
            new Promise((resolve, reject) => setTimeout(() => resolve(startQueryExecutionOutput), 20000))
        )
        .then((startQueryExecutionOutput: StartQueryExecutionOutput) =>
            athena.getQueryExecution({QueryExecutionId: startQueryExecutionOutput.QueryExecutionId}).promise()
        )
        .then((getQueryExecutionOutput: GetQueryExecutionOutput) =>
            athena.getQueryResults({
                QueryExecutionId: getQueryExecutionOutput.QueryExecution.QueryExecutionId
            }).promise()
        )
        .then((getQueryResultsOutput: GetQueryResultsOutput) =>
            new Promise((resolve, reject) => {
                const value = parseFloat(getQueryResultsOutput.ResultSet.Rows[1].Data[0].VarCharValue);

                if (value) resolve(value);
                else reject(`Missing result in query output: ${JSON.stringify(getQueryResultsOutput)}`)
            })
        )
}
