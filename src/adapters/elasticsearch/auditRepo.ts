import { AuditLog } from '../../types';
import { esClient } from './client'; 
import { v4 as uuidv4 } from 'uuid';

export async function saveAuditLog(log: AuditLog): Promise<void> {
    try {
        await esClient.index({
            index: 'dedup_audit_logs',
            id: uuidv4(),             
            document: log             
        });
        
        console.log(`Audit log saved for run: ${log.run_id}`);
    } catch (e) {
        console.error("Critical: Failed to save audit log", e);
        throw e; 
    }
}