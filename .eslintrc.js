module.exports = {
	extends: ['@guardian/eslint-config-typescript'],
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: ['./cdk/tsconfig.json'],
	},
	rules: {
		'@typescript-eslint/no-misused-promises': [
			'error',
			{
				checksVoidReturn: false,
			},
		],
	},
};
