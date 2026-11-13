import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Container } from './container'
import { errorHandler } from './errors'
import { authMiddleware, type AppEnv } from './middleware/auth'
import { profileRoutes } from './routes/profile'
import { recommendationRoutes } from './routes/recommendations'

export function createApp(container: Container) {
    const app = new Hono<AppEnv>()

    app.use('*', cors())
    app.use('/api/*', authMiddleware)
    app.onError(errorHandler)

    app.get('/', (c) => c.json({ status: 'ok' }))
    app.route('/api/profile', profileRoutes(container.handlers))
    app.route('/api/recommendations', recommendationRoutes(container.agent))

    return app
}
