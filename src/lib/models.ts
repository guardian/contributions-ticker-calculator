interface TickerConfig {
	StartDate: string;
	EndDate: string;
	CountryCode: string;
	Currency: string;
	CampaignCode?: string;
	InitialAmount: number;
	GoalAmount: number;
}

interface TickerResult {
	total: number;
	goal: number;
}

export { TickerConfig, TickerResult };
