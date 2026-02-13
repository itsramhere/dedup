import { esClient } from '../adapters/elasticsearch/client';

export async function executeFlag(secondaryId: string, reason: string): Promise<void> {
    try {
        await esClient.updateByQuery({
            index: 'users',
            refresh: true,
            query: {
                term: {
                    user_id: secondaryId
                }
            },
            script: {
                source: "ctx._source.status = 'flagged'; ctx._source.flag_reason = params.reason;",
                lang: "painless",
                params: {
                    reason: reason
                }
            }
        });
        
        console.log(`User ${secondaryId} flagged for review. Reason: ${reason}`);

    } catch (error) {
        console.error(`Failed to flag user ${secondaryId}:`, error);
        throw error;
    }
}