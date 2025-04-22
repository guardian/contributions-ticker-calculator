import {buildAuthClient, runQuery} from './lib/bigquery';
import type {TickerConfig, TickerResult} from './lib/models';
import { writeToS3 } from "./lib/s3";
import { getSSMParam } from './lib/ssm';

const TickerBucket = 'contributions-ticker';

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

    const amount = await runQuery(authClient, stage, campaignConfig);

    const result: TickerResult = {
        goal: campaignConfig.GoalAmount,
        total: Math.round(amount) + campaignConfig.InitialAmount,
    }
    console.log('Writing result to S3:', result);

    const s3Result = await writeToS3({
        data: result,
        bucket: TickerBucket,
        key: `${stage}/${campaignName}.json`,
    })
    console.log('Result from S3: ', s3Result);
}
