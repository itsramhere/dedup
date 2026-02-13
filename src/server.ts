import * as dotenv from 'dotenv';
dotenv.config();
import path from 'path'
import Fastify from 'fastify';
import dedupRoutes from './routes/dedupRoutes';
import middlewarePlugin from './plugins/authPlugin';
import { adminRoutes } from './routes/adminRoutes';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
const fastify = Fastify({
    logger: {
        level: 'info',
    }
});

fastify.register(middlewarePlugin);

fastify.register(dedupRoutes, { prefix: '/api/v1' });

fastify.register(adminRoutes, { prefix: '/api/v1/admin' });

fastify.setErrorHandler((error: any, request, reply) => {
    request.log.error(error);
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
        success: false,
        error: error.name,
        message: error.message,
        trace_id: request.id
    });
});

const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' });
        console.log('De-duplication API is live at http://localhost:3000/api/v1');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();