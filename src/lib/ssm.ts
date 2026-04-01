import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

export const getSSMParam = async (
	key: string,
	stage: 'CODE' | 'PROD',
): Promise<string> => {
	const ssm = new SSMClient({ region: 'eu-west-1' });
	const command = new GetParameterCommand({
		Name: `/ticker-calculator/${stage}/${key}`,
		WithDecryption: true,
	});

	try {
		const result = await ssm.send(command);
		const value = result.Parameter?.Value;

		if (value) {
			return value;
		}

		throw new Error(`Failed to retrieve config from parameter store: ${key}`);
	} catch (error) {
		throw new Error(`Failed to retrieve config from parameter store: ${key}`);
	}
};
