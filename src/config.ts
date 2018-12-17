export class Config {
    Stage: string = process.env.Stage;

    StartDateTime: string = process.env.StartDateTime;
    EndDateTime: string = process.env.EndDateTime;

    //A quoted, comma-separated list as a string, e.g. 'US','AU'
    CountryCodesString: string = process.env.CountryCodes;

    InitialAmount: number = parseInt(process.env.InitialAmount);
    GoalAmount: number = parseInt(process.env.GoalAmount);

    AthenaOutputBucket: string = process.env.AthenaOutputBucket;
    TickerBucket: string = process.env.TickerBucket;

    SchemaName: string = process.env.SchemaName;
}
