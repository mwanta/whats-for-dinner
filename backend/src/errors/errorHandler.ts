import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { AppError, DatabaseError } from './AppError'

const INTERNAL_ERROR = 'Internal server error'

/** Single place that maps thrown errors to HTTP responses. Register with app.onError. */
export function errorHandler(err: Error, c: Context): Response {
    if (err instanceof HTTPException) {
        return err.getResponse()
    }
    if (err instanceof DatabaseError) {
        console.error(`[${err.code}] ${c.req.method} ${c.req.path}:`, err.message)
        return c.json({ error: INTERNAL_ERROR, code: err.code }, err.status)
    }
    if (err instanceof AppError) {
        return c.json({ error: err.message, code: err.code }, err.status)
    }
    // c.req.json() throws SyntaxError on a malformed body.
    if (err instanceof SyntaxError) {
        return c.json({ error: 'Request body must be valid JSON', code: 'invalid_json' }, 400)
    }
    console.error(`[unhandled] ${c.req.method} ${c.req.path}:`, err)
    return c.json({ error: INTERNAL_ERROR, code: 'internal_error' }, 500)
}
