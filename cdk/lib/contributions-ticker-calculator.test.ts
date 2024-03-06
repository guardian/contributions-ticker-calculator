import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import {
    supportApisDomain,
    supportCertificateId,
    supportHostedZoneId,
} from '../bin/cdk';
import { ContributionsTickerCalculatorAPI } from './contributions-ticker-calculator';

describe('The Contributions Ticker Calculator stack', () => {
    it('matches the snapshot', () => {
        const app = new App();
        const codeStack = new ContributionsTickerCalculatorAPI(app, 'contributions-ticker-calculator-CODE', {
            stack: 'membership',
            stage: 'CODE',
            domainName: `contributions-ticker-calculator.code.${supportApisDomain}`,
            hostedZoneId: supportHostedZoneId,
            certificateId: supportCertificateId,
            acquisitionEventsBucket: 'acquisition_events_code',
        });
        const prodStack = new ContributionsTickerCalculatorAPI(app, 'contributions-ticker-calculator-PROD', {
            stack: 'membership',
            stage: 'PROD',
            domainName: `contributions-ticker-calculator.${supportApisDomain}`,
            hostedZoneId: supportHostedZoneId,
            certificateId: supportCertificateId,
            acquisitionEventsBucket: 'acquisition_events_prod',
        });

        expect(Template.fromStack(codeStack).toJSON()).toMatchSnapshot();
        expect(Template.fromStack(prodStack).toJSON()).toMatchSnapshot();
    });
});
