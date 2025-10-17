import { BigQuery } from '@google-cloud/bigquery';
import type {
	BaseExternalAccountClient,
	ExternalAccountClientOptions,
} from 'google-auth-library';
import { ExternalAccountClient } from 'google-auth-library';
import { z } from 'zod';
import type {
	MoneyTickerConfig,
	SupporterCountTickerConfig,
	TickerConfig,
} from './models';

export const buildAuthClient = (
	clientConfig: string,
): Promise<BaseExternalAccountClient> =>
	new Promise((resolve, reject) => {
		const parsedConfig = JSON.parse(
			clientConfig,
		) as ExternalAccountClientOptions;
		const authClient = ExternalAccountClient.fromJSON(parsedConfig);
		if (authClient) {
			resolve(authClient);
		} else {
			reject('Failed to create Google Auth Client');
		}
	});

export const BigQueryResultDataSchema = z.array(
	z.object({
		amount: z.number(),
	}),
);

const buildMoneyQuery = (config: MoneyTickerConfig): string => {
	/**
	 * We count acquisitions twice if billing period is monthly and two payments will be made during the campaign.
	 * Assumes no campaign runs for more than 2 months.
	 */
	return `
        WITH contributions__once AS (
            SELECT SUM(amount) AS amount
            FROM datalake.fact_acquisition_event
            WHERE event_timestamp >= '${
							config.StartDate
						}' AND event_timestamp < '${config.EndDate}'
            AND product IN ('CONTRIBUTION', 'RECURRING_CONTRIBUTION')
            AND (
                payment_frequency IN ('ONE_OFF', 'ANNUALLY') OR
                (payment_frequency = 'MONTHLY' AND event_timestamp >= TIMESTAMP(DATE_SUB('${
									config.EndDate
								}', INTERVAL 1 MONTH)))
            )
            AND currency = '${config.Currency}'
            AND country_code = '${config.CountryCode}'
        ),
        contributions__twice AS (
            SELECT SUM(amount)*2 AS amount
            FROM datalake.fact_acquisition_event
            WHERE event_timestamp >= '${
							config.StartDate
						}' AND event_timestamp < TIMESTAMP(DATE_SUB('${
		config.EndDate
	}', INTERVAL 1 MONTH))
            AND product = 'RECURRING_CONTRIBUTION'
            AND payment_frequency = 'MONTHLY'
            AND currency = '${config.Currency}'
            AND country_code = '${config.CountryCode}'
        ),
        supporter_plus_or_tier_three__once AS (
            SELECT SUM(first_payment_unit_price_transaction_currency) AS amount
            FROM reader_revenue.fact_holding_acquisition
            WHERE acquired_date >= '${config.StartDate}' AND acquired_date < '${
		config.EndDate
	}'
            AND reader_revenue_product IN ('Supporter Plus', 'Tier Three')
            AND (billing_period = 'Annual' OR acquired_date >= DATE_SUB('${
							config.EndDate
						}', INTERVAL 1 MONTH))
            AND transaction_currency = '${config.Currency}'
            AND country_code = '${config.CountryCode}'
        ),
        supporter_plus_or_tier_three__twice AS (
            SELECT SUM(first_payment_unit_price_transaction_currency)*2 AS amount
            FROM reader_revenue.fact_holding_acquisition
            WHERE acquired_date >= '${
							config.StartDate
						}' AND acquired_date < DATE_SUB('${
		config.EndDate
	}', INTERVAL 1 MONTH)
            AND reader_revenue_product IN ('Supporter Plus', 'Tier Three')
            AND billing_period = 'Month'
            AND transaction_currency = '${config.Currency}'
            AND country_code = '${config.CountryCode}'
        ),
        iap_acquisitions__once AS (
            SELECT SUM(amount) AS amount
            FROM datalake.fact_acquisition_event
            WHERE event_timestamp >= '${
							config.StartDate
						}' AND event_timestamp < '${config.EndDate}'
            AND product ='APP_PREMIUM_TIER'
            AND (
                payment_frequency IN ('ONE_OFF', 'ANNUALLY') OR
                (payment_frequency = 'MONTHLY' AND event_timestamp >= TIMESTAMP(DATE_SUB('${
									config.EndDate
								}', INTERVAL 1 MONTH)))
            )
            AND currency = '${config.Currency}'
            AND country_code = '${config.CountryCode}'
        ),
        iap_acquisitions__twice AS (
            SELECT SUM(amount)*2 AS amount
            FROM datalake.fact_acquisition_event
            WHERE event_timestamp >= '${
							config.StartDate
						}' AND event_timestamp < TIMESTAMP(DATE_SUB('${
		config.EndDate
	}', INTERVAL 1 MONTH))
            AND product ='APP_PREMIUM_TIER'
            AND payment_frequency = 'MONTHLY'
            AND currency = '${config.Currency}'
            AND country_code = '${config.CountryCode}'
        ) ${
					config.CountryCode === 'AU'
						? `, guardian_weekly__once AS (
								SELECT SUM(initial_rate_plan_unit_price_transaction_currency) AS amount
									FROM reader_revenue.fact_holding_acquisition
									WHERE acquired_date >= '${config.StartDate}'
									AND acquired_date < DATE_SUB('${config.EndDate}', INTERVAL 1 MONTH)
										AND reader_revenue_product IN ('Guardian Weekly - Subscription')
										AND (billing_period in ('Annual','Quarter') OR acquired_date >= DATE_SUB('${config.EndDate}', INTERVAL 1 MONTH))
										AND transaction_currency = '${config.Currency}'
										AND country_code = '${config.CountryCode}'
							),
							guardian_weekly__twice AS (
									SELECT SUM(initial_rate_plan_unit_price_transaction_currency)*2 AS amount
									FROM reader_revenue.fact_holding_acquisition
									WHERE acquired_date >= '${config.StartDate}' AND acquired_date < DATE_SUB('${config.EndDate}', INTERVAL 1 MONTH)
									AND reader_revenue_product IN ('Guardian Weekly - Subscription')
									AND billing_period = 'Month'
									AND transaction_currency = '${config.Currency}'
									AND country_code = '${config.CountryCode}'
							)`
						: ''
				}
        SELECT COALESCE(SUM(amount), 0) AS amount FROM (
                    SELECT amount FROM contributions__once UNION ALL
                    SELECT amount FROM contributions__twice UNION ALL
                    SELECT amount FROM supporter_plus_or_tier_three__once UNION ALL
                    SELECT amount FROM supporter_plus_or_tier_three__twice  ${
											config.CountryCode === 'AU'
												? `UNION ALL
                    SELECT amount FROM iap_acquisitions__once UNION ALL
                    SELECT amount FROM iap_acquisitions__twice UNION ALL
										SELECT amount FROM guardian_weekly__once UNION ALL
										SELECT amount FROM guardian_weekly__twice`
												: ''
										}
        )
    `;
};

const buildSupporterCountQuery = (
	config: SupporterCountTickerConfig,
): string => {
	return `
        SELECT COUNT(*) AS amount
        FROM datalake.fact_acquisition_event
        WHERE event_timestamp >= '${config.StartDate}' AND event_timestamp < '${config.EndDate}'
        AND product IN ('CONTRIBUTION', 'RECURRING_CONTRIBUTION', 'SUPPORTER_PLUS', 'TIER_THREE')
    `;
};

export const runQuery = async (
	authClient: BaseExternalAccountClient,
	stage: 'CODE' | 'PROD',
	config: TickerConfig,
): Promise<number> => {
	const bigquery = new BigQuery({
		projectId: `datatech-platform-${stage.toLowerCase()}`,
		authClient,
	});
	const query =
		config.type === 'Money'
			? buildMoneyQuery(config)
			: buildSupporterCountQuery(config);

	console.log('Running query:', query);

	const result = await bigquery.query(query);

	const resultData = BigQueryResultDataSchema.parse(result[0]);
	// We only expect one row in the result
	if (resultData.length > 0) {
		return resultData[0].amount;
	}

	return Promise.reject('No data returned from BigQuery');
};
