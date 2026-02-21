
export interface ContentItem {
    id: string;
    type: string;
    title: string;
    slug?: string;
    summary?: string;
    date: string;
}

export interface CaseItem {
    title: string;
    summary: string;
}

export interface LawyerDetail {
    id: string;
    name: string;
    firm: string;
    location: string;
    career: string;
    education: string;
    expertise: string[];
    imageUrl?: string;
    cutoutImageUrl?: string;
    phone?: string;
    homepage?: string;
    kakao_id?: string;
    content_items: ContentItem[];
    cases: CaseItem[];
    introduction_short?: string;
    introduction_long?: string;
    expertise_score?: number;
}

export interface Consultation {
    id: string;
    created_at: string;
    status: string;
    client_name: string;
    client_phone: string;
    original_text: string;
    case_title: string;
    primary_area: string;
    summary: string;
    confidence: number;
    key_facts: string[];
    key_issues: string[];
    checklist: string[];
    next_steps: string[];
    risk_notes: string[];
    missing_questions: string[];
    tags: string[];
    links?: string[];
    chat_client_id?: string;
}
