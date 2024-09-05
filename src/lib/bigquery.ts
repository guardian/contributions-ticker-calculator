import { BigQuery } from '@google-cloud/bigquery';
import type { BaseExternalAccountClient, ExternalAccountClientOptions } from 'google-auth-library';
import { ExternalAccountClient } from 'google-auth-library';
import type { TickerConfig } from './models';

export const buildAuthClient = (clientConfig: string): Promise<BaseExternalAccountClient> => new Promise((resolve, reject) => {
    const parsedConfig = JSON.parse(clientConfig) as ExternalAccountClientOptions;
    const authClient = ExternalAccountClient.fromJSON(parsedConfig);
    if (authClient) {
        resolve(authClient);
    } else {
        reject('Failed to create Google Auth Client');
    }
});

export const runQuery = async (
    authClient: BaseExternalAccountClient,
    stage: 'CODE' | 'PROD',
    config: TickerConfig,
): Promise<number> => {
    const bigquery = new BigQuery({
        projectId: `datatech-platform-${stage.toLowerCase()}`,
        authClient,
    });

    // TODO - count monthly more than once?
    const result = await bigquery.query(
        `
            WITH single_contribs AS (
                SELECT SUM(amount) AS amount
                FROM datalake.fact_acquisition_event 
                WHERE event_timestamp >= '${config.StartDate}'
                AND product = 'CONTRIBUTION'
                AND payment_frequency = 'ONE_OFF'
                AND currency = '${config.Currency}'
                AND country_code = '${config.CountryCode}'
            ),
            annual_contribs AS (
                SELECT SUM(amount) AS amount
                FROM datalake.fact_acquisition_event
                WHERE event_timestamp >= '${config.StartDate}'
                AND product = 'RECURRING_CONTRIBUTION'
                AND payment_frequency = 'ANNUALLY'
                AND currency = '${config.Currency}'
                AND country_code = '${config.CountryCode}'
            ),
            monthly_contribs AS (
                SELECT SUM(amount) AS amount
                FROM datalake.fact_acquisition_event
                WHERE event_timestamp >= '${config.StartDate}'
                AND product = 'RECURRING_CONTRIBUTION'
                AND payment_frequency = 'MONTHLY'
                AND currency = '${config.Currency}'
                AND country_code = '${config.CountryCode}'
            ),
            supporter_plus_and_tier_three AS (
                SELECT SUM(first_payment_unit_price_transaction_currency) AS amount
                FROM reader_revenue.fact_holding_acquisition
                WHERE acquired_date >= '${config.StartDate}'
                AND reader_revenue_product IN ('Supporter Plus', 'Tier Three')
                AND transaction_currency = '${config.Currency}'
                AND country_code = '${config.CountryCode}'
            )
            SELECT SUM(amount) FROM (
                SELECT amount FROM supporter_plus_and_tier_three UNION ALL
                SELECT amount FROM single_contribs UNION ALL
                SELECT amount FROM annual_contribs UNION ALL
                SELECT amount  FROM monthly_contribs
            )
        `
    );

    console.log('result: ', result);
    if (result[0][0]) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access -- checked
        const value = result[0][0]?.amount;
        if (Number.isNaN(value)) {
            console.log('NaN: ', value);
            return 0;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- checked for NaN
        return value;
    }
    return 0;
}
