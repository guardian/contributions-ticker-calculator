import { handler } from './lambda';

handler('US')
	.then(() => console.log('Succeeded!'))
	.catch((e) => console.log('Something went wrong: ', e));
