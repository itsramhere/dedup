import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const middlewarePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.addHook('preHandler', async (request, reply) => {
        const apiKey = request.headers['x-api-key'];
        const validKey = process.env.API_SECRET;

        if (!validKey) {
            request.log.error("CRITICAL: API_SECRET is not set in .env!");
            return reply.status(500).send({ error: "Server misconfiguration" });
        }

        if (apiKey !== validKey) {
            request.log.warn(`Unauthorized access attempt from IP: ${request.ip}`);
            return reply.status(401).send({ 
                error: "Unauthorized", 
                message: "Invalid or missing API Key" 
            });
        }

        request.log.info('Middleware: Request authorized and proceeding');
    });

    fastify.addHook('onResponse', async (request, reply) => {
        request.log.info(`Request completed in ${reply.elapsedTime}ms`);
    });
};

export default fp(middlewarePlugin);