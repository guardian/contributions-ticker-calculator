import { handler } from './lambda';

handler()
    .then(() => console.log('Succeeded!'))
    .catch((e) => console.log('Something went wrong: ', e));
