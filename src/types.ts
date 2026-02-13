export interface User {
    user_id: string;
    name: string;
    dob: string; 
    email: string;
    phone_country_code: string; 
    phone_number: string;        
    house_no: string;           
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    country: string; 
    pin_code: string;
    address_raw: string;
    created_at: string;
    status: 'active' | 'merged';
    merged_into?: string
}

export interface DuplicatedUser {
    run_id: string;
    primary_user_id: string;
    current_user_id: string; 
    email_match: boolean;
    phone_match: boolean;
    dob_match: boolean;
    address_similarity_score: number;
    name_similarity_score: number;
    blocking_criteria_used: string[];
}

export interface AuditLog {
    run_id: string;
    timestamp: string;
    primary_user_id: string;
    secondary_user_id: string;
    decision: 'merge' | 'flag' | 'ignore';
    confidence_score: number;
    reason: string;
    fields_used: string[];
    action_taken: string;
}

export interface Constraints{
    country: string,
    state: string,
    city: string
}