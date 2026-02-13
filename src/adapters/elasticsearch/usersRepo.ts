import {User, Constraints} from '../../types';
import { esClient } from './client'; // Ensure client is imported

export async function getUserById(userId: string): Promise<User | null> {
    const response = await esClient.search<User>({ 
        index: 'users', 
        query: {
            match: {
                user_id: userId
            }
        }
    });
    const hit = response.hits.hits[0];
    return hit ? (hit._source as User) : null; 
}

export async function findCandidates(user: User): Promise<User[]> {
    const shouldClauses: any[] = [];

    if (user.name) {
        shouldClauses.push({ match: { name: user.name } });
    }
    
    if (user.city) {
        shouldClauses.push({ match: { city: user.city } });
    }
    if (shouldClauses.length === 0) {
        return [];
    }

    const response = await esClient.search<User>({
        index: 'users',
        query: {
            bool: {
                should: shouldClauses,
                must_not: { term: { user_id: user.user_id } }
            }
        }
    });

    return response.hits.hits.map(hit => hit._source as User);
}

export async function getFlaggedUsers(): Promise<User[]> {
    const response = await esClient.search<User>({
        index: 'users',
        query: {
            term: { status: 'flagged' }
        }
    });
    return response.hits.hits.map(hit => hit._source as User);
}