import {StartQueryExecutionInput, StartQueryExecutionOutput} from "aws-sdk/clients/athena";
import moment = require("moment");
import {Moment} from "moment";
import {getQueries, Query} from "./queries";

class Config {
    Stage: string = process.env.Stage;

    StartDate: string = process.env.StartDate;
    EndDate: string = process.env.EndDate;

    CountryCode: string = process.env.CountryCode;
    Currency: string = process.env.Currency;
    CampaignCode: string = process.env.CampaignCode;

    AthenaOutputBucket: string = process.env.AthenaOutputBucket;

    SchemaName: string = process.env.SchemaName;
}

const AWS = require('aws-sdk');
const config = new Config();
const athena = new AWS.Athena({region: 'eu-west-1'});

/**
 * Executes Athena queries and returns the execution IDs
 */
export async function handler(): Promise<string[]> {

    const StartDate: Moment = moment(config.StartDate);
    const EndDate: Moment = moment(config.EndDate);

    console.log(`Getting total for period ${config.StartDate}-${config.EndDate} with country code ${config.CountryCode} and currency ${config.Currency}`);

    const queries = getQueries(StartDate, EndDate, config.CountryCode, config.Currency, config.Stage, config.CampaignCode);

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
