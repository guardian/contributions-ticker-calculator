export class Config {
    StartDateTime: string = process.env.StartDateTime;
    EndDateTime: string = process.env.EndDateTime;

    //A quoted, comma-separated list as a string, e.g. 'US','AU'
    CountryCodesString: string = process.env.CountryCodes;

    InitialAmount: number = parseInt(process.env.InitialAmount);

    AthenaOutputBucket: string = process.env.AthenaOutputBucket;
    TickerBucket: string = process.env.TickerBucket;

    SchemaName: string = process.env.SchemaName;
}
