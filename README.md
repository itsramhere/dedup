# Dedup Service

Dedup is a high-performance, intelligent user deduplication engine built with Node.js, Fastify, and Elasticsearch. It is designed to identify duplicate user profiles using fuzzy logic, phonetic matching, and NLP techniques, subsequently performing actions like automatic merging or flagging for manual review based on configurable confidence thresholds.

---

##  Features

- **Intelligent Matching:** Utilizes Double Metaphone for phonetic comparisons and Dice Coefficient for string similarity (names, addresses).
- **NLP Integration:** Uses wink-nlp to normalize text and remove noise before comparison.
- **Decision Engine:** A rule-based system that assigns confidence scores to determine if a profile should be Auto-Merged, Flagged for Review, or Ignored.
- **Audit Logging:** Every decision and action is recorded in Elasticsearch (`dedup_audit_logs`) for transparency and debugging.
- **Scalable Architecture:** Built on Fastify for low overhead and Elasticsearch for rapid data retrieval.
- **Automated Scheduling:** Includes node-cron jobs to run weekly deduplication scans on active users.
- **Admin API:** Provides endpoints to review flagged users and manually resolve conflicts.

---

##  Tech Stack

- **Runtime:** Node.js (v18+) & TypeScript  
- **Framework:** Fastify  
- **Database / Search:** Elasticsearch  
- **NLP & Math:** wink-nlp, natural, double-metaphone, dice-coefficient  
- **Validation:** Zod  
- **Logging:** Pino  
- **Containerization:** Docker  

---

##  Project Structure

```plaintext
dedup/
├── scripts/               # Utility scripts (Seeding, Batch Runs)
├── src/
│   ├── actions/           # Write operations (Flag, Merge)
│   ├── adapters/          # Database clients (Elasticsearch)
│   ├── agent/             # Core Logic (DedupAgent, DecisionEngine, SimilarityEngine)
│   ├── plugins/           # Fastify plugins (Auth middleware)
│   ├── routes/            # API Route definitions
│   ├── types.ts           # TypeScript interfaces
│   └── server.ts          # Application entry point
├── Dockerfile             # Docker build configuration
├── cloudbuild.yaml        # Google Cloud Build config
└── package.json           # Dependencies and scripts
```
---

## Prerequisites

- Node.js (v18 or higher)
- Elasticsearch (v8/v9) running and accessible
- npm

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd dedup
```
### 2. Install dependencies

```bash
npm install
```
### 3. Environment Configuration
Create a .env file in the root directory

```

ELASTIC_NODE=https://your-elasticsearch-instance:9200
ELASTIC_USERNAME=elastic
ELASTIC_PASSWORD=your_password

API_SECRET=your_secure_api_key
```

---
## Usage

### 1. Seeding Data (Development)

To populate Elasticsearch with synthetic users (including intentional duplicates for testing), run:
```
npx tsx scripts/seedData.ts
```
* Generates 900 unique users

* Generates 50 exact duplicates (Merge targets)

* Generates 50 fuzzy duplicates (Flag targets)

### 2. Running the Server

Development Mode:
```
npx tsx src/server.ts
```

Production Build:
```
npm run build
npm start
```
The server will start on: http://0.0.0.0:3000

### 3. Running Batch Deduplication (Script)
To manually trigger the deduplication process via command line:
```
npx tsx scripts/runBatch.ts
```
---

## API Endpoints

### Base Path
```
/api/v1
```

### Authentication Header
```
x-api-key: <API_SECRET>
```



### Core Endpoints

```http
POST /api/v1/dedup/:userId
```
Trigger deduplication logic for a specific user ID.

```http
GET /api/v1/healthCheck
```
Service health and Elasticsearch connection status.



### Admin Endpoints

```http
GET /api/v1/admin/review/list
```
Get list of users flagged for manual review.

```http
POST /api/v1/admin/review/approve-merge
Content-Type: application/json
```

Request Body:
```json
{
  "primaryId": "string",
  "secondaryId": "string"
}
```

```http
POST /api/v1/admin/review/reject-merge
Content-Type: application/json
```

Request Body:
```json
{
  "userId": "string"
}
```

---

## Decision Logic (decisionEngine.ts)

The system evaluates pairs of users based on several criteria to determine an action:

### Merge (Auto)

Exact Email OR Phone match (Confidence: 1.0)

High Name Similarity (>0.7) AND DoB Match AND Address Match (>0.6) (Confidence: 0.9)

### Flag (For Review)

High Address Similarity (>0.8) AND DoB Match (Possible family member)

Partial Name (>0.7) AND Partial Address (>0.7) match

### Ignore

No significant similarity signals found.


