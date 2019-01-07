import {Moment} from "moment";

export class Query {
    query: string;
    token: string;

    constructor(q: string, name: string) {
        this.query = q;
        this.token = `${name}_${new Date().toISOString()}`;
    }
}

const formatDateTime = (dt: Moment) => dt.format('YYYY-MM-DD');

const fullQuery = (startDate: Moment, countryCode: string, currency: string, tableName: string) => new Query(
    'SELECT SUM(amount) ' +
        `FROM ${tableName} ` +
        `WHERE country_code = '${countryCode}' ` +
        `AND currency = '${currency}' ` +
        `AND timestamp > CAST('${formatDateTime(startDate)}' AS TIMESTAMP) `,
    'acquisition_events_full'
);

const oneOffAndAnnuallyQuery = (startDate: Moment, countryCode: string, currency: string, tableName: string) => new Query(
    'SELECT SUM(amount) ' +
        `FROM ${tableName} ` +
        `WHERE country_code = '${countryCode}' ` +
        `AND currency = '${currency}' ` +
        `AND timestamp > CAST('${formatDateTime(startDate)}' AS TIMESTAMP) ` +
        `AND payment_frequency IN ('OneOff', 'Annually')`,
    'acquisition_events_oneOffAndAnnually'
);

const firstMonthlyQuery = (startDate: Moment, oneMonthBeforeEnd: Moment, countryCode: string, currency: string, tableName: string) => new Query(
    'SELECT SUM(amount)*2 ' +
        `FROM ${tableName} ` +
        `WHERE country_code = '${countryCode}' ` +
        `AND currency = '${currency}' ` +
        `AND timestamp > CAST('${formatDateTime(startDate)}' AS TIMESTAMP) ` +
        `AND timestamp < CAST('${formatDateTime(oneMonthBeforeEnd)}' AS TIMESTAMP) ` +
        `AND payment_frequency='Monthly'`,
    'acquisition_events_firstMonthlyQuery'
);

const secondMonthlyQuery = (endDate: Moment, oneMonthBeforeEnd: Moment, countryCode: string, currency: string, tableName: string) => new Query(
    'SELECT SUM(amount) ' +
        `FROM ${tableName} ` +
        `WHERE country_code = '${countryCode}' ` +
        `AND currency = '${currency}' ` +
        `AND timestamp >= CAST('${formatDateTime(oneMonthBeforeEnd)}' AS TIMESTAMP) ` +
        `AND payment_frequency='Monthly'`,
    'acquisition_events_secondMonthlyQuery'
);

/**
 * If a campaign runs for more than a month then double any monthly contributions received before the final month.
 * This logic assumes campaigns will not run for more than 2 months.
 */
export function getQueries(startDate: Moment, endDate: Moment, countryCode: string, currency: string, stage: string): Query[] {
    const oneMonthBeforeEnd = endDate.clone().subtract(1, 'month');
    const tableName = `acquisition_events_${stage.toLowerCase()}`;

    if (oneMonthBeforeEnd.isAfter(startDate)) return [
        oneOffAndAnnuallyQuery(startDate, countryCode, currency, tableName),
        firstMonthlyQuery(startDate, oneMonthBeforeEnd, countryCode, currency, tableName),
        secondMonthlyQuery(endDate, oneMonthBeforeEnd, countryCode, currency, tableName)
    ];
    else return [fullQuery(startDate, countryCode, currency, tableName)];
}
