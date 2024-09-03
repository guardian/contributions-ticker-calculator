import 'source-map-support/register';
import { GuRoot } from '@guardian/cdk/lib/constructs/root';
import { TickerCalculator } from '../lib/ticker-calculator';

const app = new GuRoot();
new TickerCalculator(app, 'TickerCalculator-euwest-1-CODE', {
	stack: 'support',
	stage: 'CODE',
	env: { region: 'eu-west-1' },
});
new TickerCalculator(app, 'TickerCalculator-euwest-1-PROD', {
	stack: 'support',
	stage: 'PROD',
	env: { region: 'eu-west-1' },
});
