import { esClient } from '../adapters/elasticsearch/client';

export async function executeSoftMerge(primaryId: string, secondaryId: string): Promise<void> {
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
                source: `
                    ctx._source.status = 'merged'; 
                    ctx._source.merged_into = params.primaryId; 
                    ctx._source.updated_at = params.now;
                `,
                lang: "painless",
                params: {
                    primaryId: primaryId,
                    now: new Date().toISOString()
                }
            }
        });
        
        console.log(`Successfully merged user ${secondaryId} into ${primaryId}`);

    } catch (error) {
        console.error(`Failed to merge user ${secondaryId}:`, error);
        throw error; 
    }
}