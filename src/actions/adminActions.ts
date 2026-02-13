import { esClient } from '../adapters/elasticsearch/client';

export async function resolveFlagAsDistinct(userId: string): Promise<void> {
    await esClient.updateByQuery({
        index: 'users',
        refresh: true,
        query: { term: { user_id: userId } },
        script: {
            source: "ctx._source.status = 'active'; ctx._source.flag_reason = null;",
            lang: "painless"
        }
    });
}