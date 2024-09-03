import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TickerCalculator } from './ticker-calculator';

describe('The TickerCalculator stack', () => {
	it('matches the snapshot', () => {
		const app = new App();
		const stack = new TickerCalculator(app, 'TickerCalculator', {
			stack: 'support',
			stage: 'TEST',
		});
		const template = Template.fromStack(stack);
		expect(template.toJSON()).toMatchSnapshot();
	});
});
