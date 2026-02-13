import cron from 'node-cron';
import { esClient } from '../adapters/elasticsearch/client'; 
import { User } from '../types';
import { runDeduplication } from './dedupAgent';

async function getAllActiveUsers(): Promise<User[]> {
    const response = await esClient.search<User>({ 
        index: 'users',
        size: 1000,
        query: {
            term: {
                status: 'active'
            }
        }
    });

    return response.hits.hits.map(hit => hit._source as User); 
}

async function loopOverActiveUsers(): Promise<void> {
    const activeUsers = await getAllActiveUsers();
    
    if (activeUsers.length === 0) {
        console.log("No active users found to de-duplicate.");
        return;
    }

    console.log(`Starting de-duplication scan for ${activeUsers.length} users...`);

    for (const user of activeUsers) {
        try {
            await runDeduplication(user.user_id);
        } catch (error) {
            console.error(`Failed processing user ${user.user_id}:`, error);
        }
    }
}

cron.schedule("0 0 2 * * 0", async () => {
  console.log("Running weekly de-duplication cron job...");
  await loopOverActiveUsers();
});