import { handler } from './lambda';

handler({ 'Name': 'US' })
    .then(() => console.log('Succeeded!'))
    .catch((e) => console.log('Something went wrong: ', e));
