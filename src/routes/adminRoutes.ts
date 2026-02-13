import { FastifyInstance } from 'fastify';
import { getFlaggedUsers } from '../adapters/elasticsearch/usersRepo';
import { resolveFlagAsDistinct } from '../actions/adminActions';
import { executeSoftMerge } from '../actions/mergeUser';

export async function adminRoutes(fastify: FastifyInstance) {
    fastify.get('/review/list', async () => {
        const flagged = await getFlaggedUsers();
        return { count: flagged.length, users: flagged };
    });

    fastify.post('/review/approve-merge', async (request, reply) => {
        const { primaryId, secondaryId } = request.body as { primaryId: string, secondaryId: string };
        await executeSoftMerge(primaryId, secondaryId);
        return { message: "Manual merge successful" };
    });

    fastify.post('/review/reject-merge', async (request, reply) => {
        const { userId } = request.body as { userId: string };
        await resolveFlagAsDistinct(userId);
        return { message: "Flag cleared, user marked as distinct" };
    });
}