"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../src/adapters/elasticsearch/client");
const dedupAgent_1 = require("../src/agent/dedupAgent");
async function processBatchFast() {
    console.log("Starting Deduplication");
    const response = await client_1.esClient.search({
        index: 'users',
        size: 1000,
        query: { term: { status: 'active' } }
    });
    const users = response.hits.hits.map(h => h._source);
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
                await (0, dedupAgent_1.runDeduplication)(user.user_id);
            }
            catch (e) {
                errors++;
            }
        }));
        processed += chunk.length;
        process.stdout.write(`\rProgress: ${processed}/${TOTAL} (${Math.round(processed / TOTAL * 100)}%)`);
    }
    const duration = (Date.now() - startTime) / 1000;
    const speed = (processed / duration).toFixed(2);
    console.log(`\n\nfinished.`);
    console.log(`Time Taken: ${duration} seconds`);
    console.log(`Throughput: ${speed} users/sec`);
    console.log(`Errors:     ${errors}`);
}
processBatchFast();
