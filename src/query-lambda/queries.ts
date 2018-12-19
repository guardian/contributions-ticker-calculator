import {Moment} from "moment";

export class Query {
    query: string;
    token: string;

    constructor(q: string, name: string) {
        this.query = q;
        this.token = `${name}_${new Date().toISOString()}`;
    }
}

const formatDateTime = (dt: Moment) => dt.format('YYYY-MM-DD ')

const fullQuery = (startDate: Moment, countryCodesString: string, tableName: string) => new Query(
    'SELECT SUM(amount) ' +
        `FROM ${tableName} ` +
        `WHERE country_code in (${countryCodesString}) ` +
        `AND timestamp > CAST('${startDate.format('YYYY-MM-DD')}' AS TIMESTAMP) ` +
        `AND payment_frequency IN ('OneOff', 'Annual', 'Monthly')`,
    'acquisition_events_full'
);

const oneOffAndAnnualQuery = (startDate: Moment, countryCodesString: string, tableName: string) => new Query(
    'SELECT SUM(amount) ' +
        `FROM ${tableName} ` +
        `WHERE country_code in (${countryCodesString}) ` +
        `AND timestamp > CAST('${startDate.format('YYYY-MM-DD')}' AS TIMESTAMP) ` +
        `AND payment_frequency IN ('OneOff', 'Annual')`,
    'acquisition_events_oneOffAndAnnual'
);

const firstMonthlyQuery = (startDate: Moment, oneMonthBeforeEnd: Moment, countryCodesString: string, tableName: string) => new Query(
    'SELECT SUM(amount)*2 ' +
        `FROM ${tableName} ` +
        `WHERE country_code in (${countryCodesString}) ` +
        `AND timestamp > CAST('${startDate.format('YYYY-MM-DD')}' AS TIMESTAMP) ` +
        `AND timestamp < CAST('${oneMonthBeforeEnd.format('YYYY-MM-DD')}' AS TIMESTAMP) ` +
        `AND payment_frequency='Monthly'`,
    'acquisition_events_firstMonthlyQuery'
);

const secondMonthlyQuery = (endDate: Moment, oneMonthBeforeEnd: Moment, countryCodesString: string, tableName: string) => new Query(
    'SELECT SUM(amount) ' +
        `FROM ${tableName} ` +
        `WHERE country_code in (${countryCodesString}) ` +
        `AND timestamp >= CAST('${oneMonthBeforeEnd.format('YYYY-MM-DD')}' AS TIMESTAMP) ` +
        `AND payment_frequency='Monthly'`,
    'acquisition_events_secondMonthlyQuery'
);

/**
 * If a campaign runs for more than a month then double any monthly contributions received before the final month.
 * This logic assumes campaigns will not run for more than 2 months.
 */
export function getQueries(startDate: Moment, endDate: Moment, countryCodesString: string, stage: string): Query[] {
    const oneMonthBeforeEnd = endDate.clone().subtract(1, 'month');
    const tableName = `acquisition_events_${stage.toLowerCase()}`;

    if (oneMonthBeforeEnd.isAfter(startDate)) return [
        oneOffAndAnnualQuery(startDate, countryCodesString, tableName),
        firstMonthlyQuery(startDate, oneMonthBeforeEnd, countryCodesString, tableName),
        secondMonthlyQuery(endDate, oneMonthBeforeEnd, countryCodesString, tableName)
    ];
    else return [fullQuery(startDate, countryCodesString, tableName)];
}
