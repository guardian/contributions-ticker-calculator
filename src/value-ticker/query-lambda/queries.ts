import {Moment} from "moment";
import {Query} from "../../lib/query";

const formatDateTime = (dt: Moment) => dt.format('YYYY-MM-DD');

// IMPORTANT - always use this field in the queries - it is the partition field
const partitionDateField = 'acquisition_date';

const fullQuery = (startDate: Moment, countryCode: string, currency: string, tableName: string, campaignCode?: string) => new Query(
    'SELECT SUM(amount) ' +
        `FROM ${tableName} ` +
        `WHERE countryCode = '${countryCode}' ` +
        `AND currency = '${currency}' ` +
        (campaignCode ? `AND campaignCode = '${campaignCode}' ` : '') +
        `AND ${partitionDateField} >= date'${formatDateTime(startDate)}' `,
    'acquisition_events_full'
);

const oneOffAndAnnuallyQuery = (startDate: Moment, countryCode: string, currency: string, tableName: string, campaignCode?: string) => new Query(
    'SELECT SUM(amount) ' +
        `FROM ${tableName} ` +
        `WHERE countryCode = '${countryCode}' ` +
        `AND currency = '${currency}' ` +
        (campaignCode ? `AND campaignCode = '${campaignCode}' ` : '') +
        `AND ${partitionDateField} >= date'${formatDateTime(startDate)}' ` +
        `AND paymentFrequency IN ('ONE_OFF', 'ANNUALLY')`,
    'acquisition_events_oneOffAndAnnually'
);

const firstMonthlyQuery = (startDate: Moment, oneMonthBeforeEnd: Moment, countryCode: string, currency: string, tableName: string, campaignCode?: string) => new Query(
    'SELECT SUM(amount)*2 ' +
        `FROM ${tableName} ` +
        `WHERE countryCode = '${countryCode}' ` +
        `AND currency = '${currency}' ` +
        (campaignCode ? `AND campaignCode = '${campaignCode}' ` : '') +
        `AND ${partitionDateField} >= date'${formatDateTime(startDate)}' ` +
        `AND ${partitionDateField} < date'${formatDateTime(oneMonthBeforeEnd)}' ` +
        `AND paymentFrequency='MONTHLY'`,
    'acquisition_events_firstMonthlyQuery'
);

const secondMonthlyQuery = (endDate: Moment, oneMonthBeforeEnd: Moment, countryCode: string, currency: string, tableName: string, campaignCode?: string) => new Query(
    'SELECT SUM(amount) ' +
        `FROM ${tableName} ` +
        `WHERE countryCode = '${countryCode}' ` +
        `AND currency = '${currency}' ` +
        (campaignCode ? `AND campaignCode = '${campaignCode}' ` : '') +
        `AND ${partitionDateField} >= date'${formatDateTime(oneMonthBeforeEnd)}' ` +
        `AND paymentFrequency='MONTHLY'`,
    'acquisition_events_secondMonthlyQuery'
);

// const supporterCountQuery = (startDate: Moment, countryCode: string, tableName: string, campaignCode?: string) => new Query(
//     'SELECT COUNT(*) ' +
//         `FROM ${tableName} ` +
//         `WHERE countryCode = '${countryCode}' ` +
//         (campaignCode ? `AND campaignCode = '${campaignCode}' ` : '') +
//         `AND ${partitionDateField} >= date'${formatDateTime(startDate)}' `,
//     'acquisition_events_full'
// );

/**
 * If a campaign runs for more than a month then double any monthly contributions received before the final month.
 * This logic assumes campaigns will not run for more than 2 months.
 */
export function getQueries(startDate: Moment, endDate: Moment, countryCode: string, currency: string, stage: string, campaignCode?: string): Query[] {
    const oneMonthBeforeEnd = endDate.clone().subtract(1, 'month');
    const tableName = `acquisition_events_${stage.toLowerCase()}`;

    if (oneMonthBeforeEnd.isAfter(startDate)) return [
        oneOffAndAnnuallyQuery(startDate, countryCode, currency, tableName, campaignCode),
        firstMonthlyQuery(startDate, oneMonthBeforeEnd, countryCode, currency, tableName, campaignCode),
        secondMonthlyQuery(endDate, oneMonthBeforeEnd, countryCode, currency, tableName, campaignCode)
    ];
    else return [fullQuery(startDate, countryCode, currency, tableName, campaignCode)];
    // return [supporterCountQuery(startDate, countryCode, tableName, campaignCode)]
}
