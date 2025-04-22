interface MoneyTickerConfig {
    type: 'Money';
    StartDate: string;
    EndDate: string;
    CountryCode: string;
    Currency: string;
    CampaignCode?: string;
    InitialAmount: number;
    GoalAmount: number;
}

interface SupporterCountTickerConfig {
    type: 'SupporterCount';
    StartDate: string;
    EndDate: string;
    ExcludedCountryCodes: string[];
    InitialAmount: number;
    GoalAmount: number;
}

type TickerConfig = MoneyTickerConfig | SupporterCountTickerConfig;

interface TickerResult {
    total: number;
    goal: number;
    type: TickerConfig['type'];
}

export {
    TickerConfig,
    TickerResult,
    MoneyTickerConfig,
    SupporterCountTickerConfig,
}