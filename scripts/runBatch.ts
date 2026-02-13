import { esClient } from '../src/adapters/elasticsearch/client';
import { runDeduplication } from '../src/agent/dedupAgent';
import { User } from '../src/types';

async function processBatchFast() {
    console.log("Starting Deduplication");

    const response = await esClient.search<User>({ 
        index: 'users',
        size: 1000, 
        query: { term: { status: 'active' } }
    });

    const users = response.hits.hits.map(h => h._source as User);
    const TOTAL = users.length;
    
    if (TOTAL === 0) {
        console.log("No active users found.");
        return;
    }

    console.log(`Processing ${TOTAL} users`);
    
   
    const CONCURRENCY_LIMIT = 20; 
    let processed = 0;
    let errors = 0;
    const startTime = Date.now();

    for (let i = 0; i < TOTAL; i += CONCURRENCY_LIMIT) {
        const chunk = users.slice(i, i + CONCURRENCY_LIMIT);
        
        // This line runs 20 agents in parallel!
        await Promise.all(chunk.map(async (user) => {
            try {
                await runDeduplication(user.user_id);
            } catch (e) {
                errors++;
            }
        }));

        processed += chunk.length;
        process.stdout.write(`\rProgress: ${processed}/${TOTAL} (${Math.round(processed/TOTAL*100)}%)`);
    }

    const duration = (Date.now() - startTime) / 1000;
    const speed = (processed / duration).toFixed(2);

    console.log(`\n\nfinished.`);

    console.log(`Time Taken: ${duration} seconds`);
    console.log(`Throughput: ${speed} users/sec`); 
    console.log(`Errors:     ${errors}`);
  
}

processBatchFast();