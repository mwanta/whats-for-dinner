/**
 * Errors the API knows how to turn into an HTTP response. Anything else that
 * reaches the error handler is treated as an unexpected 500.
 */
export class AppError extends Error {
    constructor(
        message: string,
        readonly status: 400 | 404 | 500,
        readonly code: string
    ) {
        super(message)
        this.name = new.target.name
    }
}

/** The request is invalid: bad field values, missing fields, malformed body. */
export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400, 'validation_error')
    }
}

/** The requested record doesn't exist. */
export class NotFoundError extends AppError {
    constructor(message: string) {
        super(message, 404, 'not_found')
    }
}

/** The database rejected a query. The message is logged, never sent to the client. */
export class DatabaseError extends AppError {
    constructor(message: string, readonly cause?: unknown) {
        super(message, 500, 'database_error')
    }
}
