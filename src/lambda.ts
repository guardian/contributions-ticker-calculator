import { getSSMParam } from "./lib/ssm";

interface Config {
    StartDate: string;
    EndDate: string;
    CountryCode: string;
    Currency: string;
    CampaignCode?: string;
}

export async function handler(): Promise<void> {
    const stage = process.env.Stage;
    if (!stage || (stage !== 'CODE' && stage !== 'PROD')) {
        return Promise.reject(`Invalid or missing stage: '${stage ?? ''}'`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- config
    const tickerConfig: Config = JSON.parse(await getSSMParam('ticker-config', stage));
    const gcpConfig = await getSSMParam('gcp-wif-credentials-config', stage);

    // TODO - implement
    return Promise.resolve();
}
