import type { QueryRowsResponse} from '@google-cloud/bigquery';
import {BigQuery} from '@google-cloud/bigquery';
import type { BaseExternalAccountClient, ExternalAccountClientOptions } from 'google-auth-library';
import { ExternalAccountClient } from 'google-auth-library';
import type {TickerConfig} from './models';

export const buildAuthClient = (clientConfig: string): Promise<BaseExternalAccountClient> => new Promise((resolve, reject) => {
    const parsedConfig = JSON.parse(clientConfig) as ExternalAccountClientOptions;
    const authClient = ExternalAccountClient.fromJSON(parsedConfig);
    if (authClient) {
        resolve(authClient);
    } else {
        reject('Failed to create Google Auth Client');
    }
});

export const runQuery = (
    authClient: BaseExternalAccountClient,
    stage: 'CODE' | 'PROD',
    config: TickerConfig,
): Promise<QueryRowsResponse> => {
    const bigquery = new BigQuery({
        projectId: `datatech-platform-${stage.toLowerCase()}`,
        authClient,
    });

    return bigquery.query(
        `SELECT COUNT(*) FROM datalake.fact_acquisition_event WHERE event_timestamp >= '${config.StartDate}'`
    );
}
