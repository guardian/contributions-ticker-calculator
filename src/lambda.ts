import {buildAuthClient, runQuery} from './lib/bigquery';
import type {TickerConfig} from './lib/models';
import { getSSMParam } from './lib/ssm';

export async function handler(campaignName: string): Promise<void> {
    console.log('campaignName: ', campaignName);
    const stage = process.env.Stage;
    if (!stage || (stage !== 'CODE' && stage !== 'PROD')) {
        return Promise.reject(`Invalid or missing stage: '${stage ?? ''}'`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- config
    const tickerConfig: Record<string,TickerConfig> = JSON.parse(await getSSMParam('ticker-config', stage));
    const gcpConfig = await getSSMParam('gcp-wif-credentials-config', stage);

    const campaignConfig = tickerConfig[campaignName];
    console.log('Using config:', campaignConfig);

    const authClient = await buildAuthClient(gcpConfig);
    const result = await runQuery(authClient, stage, campaignConfig);
    console.log(result);

    // TODO - implement
    return Promise.resolve();
}
