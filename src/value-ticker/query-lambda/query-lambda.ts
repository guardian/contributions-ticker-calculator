import {QueryExecutionId} from "aws-sdk/clients/athena";
import moment = require("moment");
import {Moment} from "moment";
import {getQueries} from "./queries";
import {executeQueries} from "../../lib/query";
import {getConfig} from "../../lib/s3";

const AWS = require('aws-sdk');
const athena = new AWS.Athena({region: 'eu-west-1'});

class Config {
    StartDate: string;
    EndDate: string;

    CountryCode: string;
    Currency: string;
    CampaignCode: string;

    AthenaOutputBucket: string;

    SchemaName: string;
}

const stage = process.env.Stage;

export async function handler(): Promise<QueryExecutionId[]> {
    const config: Config = await getConfig(stage);
    console.log(config)

    const StartDate: Moment = moment(config.StartDate);
    const EndDate: Moment = moment(config.EndDate);

    console.log(`Getting total for period ${config.StartDate}-${config.EndDate} with country code ${config.CountryCode} and currency ${config.Currency}`);

    const queries = getQueries(StartDate, EndDate, config.CountryCode, config.Currency, stage, config.CampaignCode);

    return executeQueries(queries, config.AthenaOutputBucket, config.SchemaName, athena);
}
