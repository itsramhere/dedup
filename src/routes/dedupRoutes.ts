import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { runDeduplication } from '../agent/dedupAgent';
import { esClient } from '../adapters/elasticsearch/client';

const dedupRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const dedupSchema = {
        params: {
            type: 'object',
            required: ['userId'],
            properties: {
                userId: { type: 'string', minLength: 1 }
            }
        }
    };

    fastify.post('/dedup/:userId', { schema: dedupSchema }, async (request, reply) => {
        const { userId } = request.params as { userId: string };
        request.log.info(`Starting deduplication for user: ${userId}`);
        await runDeduplication(userId);

        return {
            success: true,
            message: `Deduplication complete for user ${userId}`,
            timestamp: new Date().toISOString()
        };
    });

    fastify.get('/health', async (request, reply) => {
    try {
        const clusterHealth = await esClient.cluster.health(); 
        return { 
            status: 'ok', 
            service: 'dedup-engine',
            elasticsearch: clusterHealth.status // Should be 'green' or 'yellow'
        };
    } catch (err) {
        reply.status(503).send({ status: 'error', message: 'Cloud unreachable' });
    }
});
};

export default dedupRoutes;