import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import {ContributionsTickerCalculatorAPI} from "../lib/contributions-ticker-calculator";
const app = new App();
const membershipHostedZoneId = 'Z1E4V12LQGXFEC';
const membershipCertificateId = 'c1efc564-9ff8-4a03-be48-d1990a3d79d2';
const membershipApisDomain = 'membership.guardianapis.com';
export const supportHostedZoneId = 'Z3KO35ELNWZMSX';
export const supportCertificateId = 'b384a6a0-2f54-4874-b99b-96eeff96c009';
export const supportApisDomain = 'support.guardianapis.com';


new ContributionsTickerCalculatorAPI(app, 'contributions-ticker-calculator-CODE', {
    stack: 'support',
    stage: 'CODE',
    domainName: `contributions-ticker-calculator-code.${supportApisDomain}`,
    hostedZoneId: supportHostedZoneId,
    certificateId: supportCertificateId,
    acquisitionEventsBucket: 'acquisition_events_code',
});
new ContributionsTickerCalculatorAPI(app, 'contributions-ticker-calculator-PROD', {
    stack: 'support',
    stage: 'PROD',
    domainName: `contributions-ticker-calculator.${supportApisDomain}`,
    hostedZoneId: supportHostedZoneId,
    certificateId: supportCertificateId,
    acquisitionEventsBucket: 'acquisition_events_prod',
});
