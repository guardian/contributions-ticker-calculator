import moment = require("moment");
import {Moment} from "moment";
import {getQueries} from "./queries";
import {executeQueries} from "../../lib/query";
import {getConfig} from "../../lib/s3";
import {CalculateLambdaEvent} from "../calculate-lambda/calculate-lambda";

const AWS = require('aws-sdk');
const athena = new AWS.Athena({region: 'eu-west-1'});

class Config {
    StartDate: string;
    EndDate: string;
    CountryCode: string;
    Currency: string;
    CampaignCode?: string;
}

const stage = process.env.Stage;
const athenaOutputBucket = process.env.AthenaOutputBucket;
const schemaName = 'acquisition';

interface QueryLambdaEvent {
    Name: string;
}

export async function handler(event: QueryLambdaEvent): Promise<CalculateLambdaEvent> {
    console.log({event});
    const config: Config = (await getConfig(stage))[event.Name];

    const StartDate: Moment = moment(config.StartDate);
    const EndDate: Moment = moment(config.EndDate);

    console.log(`Getting total for period ${config.StartDate}-${config.EndDate} with country code ${config.CountryCode} and currency ${config.Currency}`);

    const queries = getQueries(StartDate, EndDate, config.CountryCode, config.Currency, stage, config.CampaignCode);

    return executeQueries(queries, athenaOutputBucket, schemaName, athena)
        .then(executionIds => ({
            ExecutionIds: executionIds,
            Name: event.Name,
            Query: "AmountQuery",
        }));
}
