import {Config} from '../config';
import {StartQueryExecutionInput, StartQueryExecutionOutput} from "aws-sdk/clients/athena";
import moment = require("moment");
import {Moment} from "moment";
import {getQueries, Query} from "./queries";

const AWS = require('aws-sdk');
const config = new Config();
const athena = new AWS.Athena({region: 'eu-west-1'});

/**
 * Executes Athena queries and returns the execution IDs
 */
export async function handler(): Promise<string[]> {

    const startDateTime: Moment = moment(config.StartDateTime);
    const endDateTime: Moment = moment(config.EndDateTime);

    console.log(`Getting total for period ${config.StartDateTime}-${config.EndDateTime} and country codes ${config.CountryCodesString}`);

    const queries = getQueries(startDateTime, endDateTime, config.CountryCodesString, config.Stage);

    return Promise.all(queries.map(executeQuery))
        .then((results: StartQueryExecutionOutput[]) => results.map(result => result.QueryExecutionId))
}

function executeQuery(query: Query): Promise<StartQueryExecutionOutput> {
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
}
