import { handler } from './lambda';

handler({message: { 'Name': 'US' }})
    .then(() => console.log('Succeeded!'))
    .catch((e) => console.log('Something went wrong: ', e));
