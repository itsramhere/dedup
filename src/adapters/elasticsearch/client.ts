import { Client } from '@elastic/elasticsearch';

// This will print to your terminal as soon as the file is loaded
console.log("--- DEBUG START ---");
console.log("All Env Keys:", Object.keys(process.env).filter(k => k.includes('ELASTIC')));
console.log("Value of ELASTIC_NODE:", process.env.ELASTIC_NODE);
console.log("--- DEBUG END ---");

if (!process.env.ELASTIC_NODE) {
    console.error(" ERROR: ELASTIC_NODE is undefined.");
    console.error("Please check if your .env file has: ELASTIC_NODE=https://...");
    process.exit(1); 
}

export const esClient = new Client({
    node: process.env.ELASTIC_NODE,
    auth: {
        username: process.env.ELASTIC_USERNAME || 'elastic',
        password: process.env.ELASTIC_PASSWORD || ''
    },
    tls: { rejectUnauthorized: false }
});