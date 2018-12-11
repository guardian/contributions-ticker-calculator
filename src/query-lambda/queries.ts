import {Moment} from "moment";

export class Query {
    query: string;
    token: string;

    constructor(q: string, name: string) {
        this.query = q;
        this.token = `${name}_${new Date().toISOString()}`;
    }
}

const oneOffAndAnnualQuery = (startDateTime: Moment, countryCodesString: string, tableName: string) => new Query(
    'SELECT SUM(amount) ' +
        `FROM ${tableName} ` +
        `WHERE countrycode in (${countryCodesString}) ` +
        `AND timestamp > CAST('${startDateTime.format('YYYY-MM-DD')}' AS TIMESTAMP) ` +
        `AND paymentfrequency IN ('OneOff', 'Annual')`,
    'acquisition_events_oneOffAndAnnual'
);

const fullMonthlyQuery = (startDateTime: Moment, countryCodesString: string, tableName: string) => new Query(
    'SELECT SUM(amount) ' +
        `FROM ${tableName} ` +
        `WHERE countrycode in (${countryCodesString}) ` +
        `AND timestamp > CAST('${startDateTime.format('YYYY-MM-DD')}' AS TIMESTAMP) ` +
        `AND paymentfrequency='Monthly'`,
    'acquisition_events_fullMonthlyQuery'
);

const firstMonthlyQuery = (startDateTime: Moment, oneMonthBeforeEnd: Moment, countryCodesString: string, tableName: string) => new Query(
    'SELECT SUM(amount)*2 ' +
        `FROM ${tableName} ` +
        `WHERE countrycode in (${countryCodesString}) ` +
        `AND timestamp > CAST('${startDateTime.format('YYYY-MM-DD')}' AS TIMESTAMP) ` +
        `AND timestamp < CAST('${oneMonthBeforeEnd.format('YYYY-MM-DD')}' AS TIMESTAMP) ` +
        `AND paymentfrequency='Monthly'`,
    'acquisition_events_firstMonthlyQuery'
);

const secondMonthlyQuery = (endDateTime: Moment, oneMonthBeforeEnd: Moment, countryCodesString: string, tableName: string) => new Query(
    'SELECT SUM(amount) ' +
        `FROM ${tableName} ` +
        `WHERE countrycode in (${countryCodesString}) ` +
        `AND timestamp >= CAST('${oneMonthBeforeEnd.format('YYYY-MM-DD')}' AS TIMESTAMP) ` +
        `AND paymentfrequency='Monthly'`,
    'acquisition_events_secondMonthlyQuery'
);

/**
 * If a campaign runs for more than a month then double any monthly contributions received before the final month.
 * This logic assumes campaigns will not run for more than 2 months.
 */
export function getQueries(startDateTime: Moment, endDateTime: Moment, countryCodesString: string, stage: string): Query[] {
    const oneMonthBeforeEnd = endDateTime.clone().subtract(1, 'month');
    const tableName = `acquisition_events_${stage.toLowerCase()}`;

    if (oneMonthBeforeEnd.isAfter(startDateTime)) return [
        oneOffAndAnnualQuery(startDateTime, countryCodesString, tableName),
        firstMonthlyQuery(startDateTime, oneMonthBeforeEnd, countryCodesString, tableName),
        secondMonthlyQuery(endDateTime, oneMonthBeforeEnd, countryCodesString, tableName)
    ];
    else return [
        oneOffAndAnnualQuery(startDateTime, countryCodesString, tableName),
        fullMonthlyQuery(startDateTime, countryCodesString, tableName)
    ];
}
