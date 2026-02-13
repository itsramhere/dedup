import { DuplicatedUser } from "../types";

export function decisionTaker(du: DuplicatedUser): { decision: "merge" | "flag" | "ignore", confidence: number, reason: string } {
    if (du.email_match || du.phone_match) {
        return { 
            decision: "merge", 
            confidence: 1.0, 
            reason: du.email_match ? "Exact email match" : "Exact phone match" 
        };
    }

    if (du.name_similarity_score > 0.7 && du.dob_match && du.address_similarity_score > 0.6) {
        return { 
            decision: "merge", 
            confidence: 0.9, 
            reason: "Strong name and address similarity with matching DoB" 
        };
    }

    if (du.address_similarity_score > 0.8 && du.dob_match) {
        return { 
            decision: "flag", 
            confidence: 0.7, 
            reason: "Same address and DoB, but name similarity is low (possible family member)" 
        };
    }

    if (du.name_similarity_score > 0.7 && du.address_similarity_score > 0.7) {
        return { 
            decision: "flag", 
            confidence: 0.6, 
            reason: "Partial name and address match; needs verification" 
        };
    }

    return { 
        decision: "ignore", 
        confidence: 0.0, 
        reason: "No significant similarity signals detected" 
    };
}