export class QueryPendingError extends Error {
    name = 'QueryPendingError';
    message = 'Query pending';
}

export class QueryFailedError extends Error {
    name = 'QueryFailedError';
    message = 'Query failed';
}
