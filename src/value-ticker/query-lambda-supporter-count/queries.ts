import {Moment} from "moment";
import {Query} from "../../lib/query";

const formatDateTime = (dt: Moment) => dt.format('YYYY-MM-DD');

// IMPORTANT - always use this field in the queries - it is the partition field
const partitionDateField = 'acquisition_date';


const supporterCountQuery = (startDate: Moment, countryCode: string, tableName: string, campaignCode?: string) => new Query(
    'SELECT COUNT(*) ' +
        `FROM ${tableName} ` +
        `WHERE countryCode = '${countryCode}' ` +
        (campaignCode ? `AND campaignCode = '${campaignCode}' ` : '') +
        `AND ${partitionDateField} >= date'${formatDateTime(startDate)}' `,
    'acquisition_events_full'
);


export function getQueries(startDate: Moment, endDate: Moment, countryCode: string, currency: string, stage: string, campaignCode?: string): Query[] {

    const tableName = `acquisition_events_${stage.toLowerCase()}`;

    return [supporterCountQuery(startDate, countryCode, tableName, campaignCode)]
}
