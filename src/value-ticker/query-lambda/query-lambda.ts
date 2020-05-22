import {QueryExecutionId} from "aws-sdk/clients/athena";
import moment = require("moment");
import {Moment} from "moment";
import {getQueries} from "./queries";
import {executeQueries} from "../../lib/query";

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

const config = new Config();

export async function handler(): Promise<QueryExecutionId[]> {

    const StartDate: Moment = moment(config.StartDate);
    const EndDate: Moment = moment(config.EndDate);

    console.log(`Getting total for period ${config.StartDate}-${config.EndDate} with country code ${config.CountryCode} and currency ${config.Currency}`);

    const queries = getQueries(StartDate, EndDate, config.CountryCode, config.Currency, config.Stage, config.CampaignCode);

    return executeQueries(queries, config.AthenaOutputBucket, config.SchemaName);
}
