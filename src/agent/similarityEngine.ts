import { User, DuplicatedUser } from '../types';
import { doubleMetaphone } from 'double-metaphone';
import { diceCoefficient } from 'dice-coefficient';
import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';

const nlp = winkNLP(model);
const its = nlp.its;

function normalize(text: string): string {
    if (!text) return '';
    const doc = nlp.readDoc(text);
    return doc.tokens()
        .filter((t) => t.out(its.type) !== 'punctuation')
        .out(its.normal)
        .join(' ');
}


export function emailMatch(user1: User, user2: User): boolean {
    if (!user1.email || !user2.email) return false;
    return user1.email.toLowerCase() === user2.email.toLowerCase();
}

export function phoneMatch(user1: User, user2: User): boolean {
    if (!user1.phone_number || !user2.phone_number) return false;
    return user1.phone_number === user2.phone_number;
}

export function DoBMatch(user1: User, user2: User): boolean {
    if (!user1.dob || !user2.dob) return false;
    return user1.dob === user2.dob;
}


export function compareNames(name1: string, name2: string): number {
    const n1 = normalize(name1);
    const n2 = normalize(name2);

    const code1 = doubleMetaphone(n1);
    const code2 = doubleMetaphone(n2);
    
    const phoneticBonus = (code1[0] === code2[0]) ? 0.4 : 0;
    
    const distanceScore = diceCoefficient(n1, n2);
    return Math.min(1.0, distanceScore + phoneticBonus);
}


export function compareAddresses(user1: User, user2: User): number {
    const addr1 = normalize(`${user1.house_no} ${user1.address_line_1} ${user1.city}`);
    const addr2 = normalize(`${user2.house_no} ${user2.address_line_1} ${user2.city}`);
    
    return diceCoefficient(addr1, addr2);
}


export function calculateAllScores(
    runId: string, 
    primary: User, 
    candidate: User
): DuplicatedUser {
    return {
        run_id: runId,
        primary_user_id: primary.user_id,
        current_user_id: candidate.user_id,
        email_match: emailMatch(primary, candidate),
        phone_match: phoneMatch(primary, candidate),
        dob_match: DoBMatch(primary, candidate),
        address_similarity_score: compareAddresses(primary, candidate),
        name_similarity_score: compareNames(primary.name, candidate.name),
        blocking_criteria_used: ['city', 'state'] 
    };
}