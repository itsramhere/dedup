import { User, Constraints, AuditLog, DuplicatedUser } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getUserById, findCandidates } from '../adapters/elasticsearch/usersRepo';
import { calculateAllScores } from './similarityEngine';
import { executeSoftMerge } from '../actions/mergeUser';
import { executeFlag } from '../actions/flagUser';
import { saveAuditLog } from '../adapters/elasticsearch/auditRepo';
import { decisionTaker } from './decisionEngine';

export async function runDeduplication(primaryUserId: string): Promise<void> {
    const runId = uuidv4();

    const thisUser = await getUserById(primaryUserId);
    if (!thisUser) {
        console.error("User not found");
        return;
    }

    const userConstraints: Constraints = {
        city: thisUser.city,
        country: thisUser.country,
        state: thisUser.state,
    };

    const matchedCandidates = await findCandidates(thisUser);
    
    const matchScores: DuplicatedUser[] = []; 

    for (const candidate of matchedCandidates) {
        if (candidate.user_id === primaryUserId) continue; 

        const userDuplication = calculateAllScores(runId, thisUser, candidate);
        matchScores.push(userDuplication);
    }
    for (const score of matchScores) {
        const thisDecision = decisionTaker(score);
        
        try {
            if (thisDecision.decision === "ignore") {
                const newLog: AuditLog = {
                    run_id: runId,
                    timestamp: new Date().toISOString(),
                    primary_user_id: score.primary_user_id,
                    secondary_user_id: score.current_user_id,
                    decision: "ignore",
                    confidence_score: thisDecision.confidence,
                    reason: thisDecision.reason,
                    fields_used: score.blocking_criteria_used,
                    action_taken: "ignored_low_similarity"
                };
                await saveAuditLog(newLog);
            } 
            else if (thisDecision.decision === "merge") {
                await executeSoftMerge(primaryUserId, score.current_user_id);
                
                const newLog: AuditLog = {
                    run_id: runId,
                    timestamp: new Date().toISOString(),
                    primary_user_id: score.primary_user_id,
                    secondary_user_id: score.current_user_id,
                    decision: "merge",
                    confidence_score: thisDecision.confidence,
                    reason: thisDecision.reason,
                    fields_used: score.blocking_criteria_used,
                    action_taken: "soft_merge_executed"
                };
                await saveAuditLog(newLog);
            } 
            else if (thisDecision.decision === "flag") {
                await executeFlag(score.current_user_id, thisDecision.reason); 
                
                const newLog: AuditLog = {
                    run_id: runId,
                    timestamp: new Date().toISOString(),
                    primary_user_id: score.primary_user_id,
                    secondary_user_id: score.current_user_id,
                    decision: "flag",
                    confidence_score: thisDecision.confidence,
                    reason: thisDecision.reason,
                    fields_used: score.blocking_criteria_used,
                    action_taken: "user_flagged_for_review"
                };
                await saveAuditLog(newLog);
            }
        } catch (e) {
            console.error(`Error processing candidate ${score.current_user_id}`, e);
            
            const newLog: AuditLog = {
                run_id: runId,
                timestamp: new Date().toISOString(),
                primary_user_id: score.primary_user_id,
                secondary_user_id: score.current_user_id,
                decision: "ignore", 
                confidence_score: 0,
                reason: "Error occurred during processing",
                fields_used: [],
                action_taken: "error_occurred"
            };
            await saveAuditLog(newLog);
        }
    }
}