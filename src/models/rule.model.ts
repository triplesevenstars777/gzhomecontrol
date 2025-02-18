export interface Rule {
    _id?: string;
    source: RuleSource;
    condition: string; // ['>', '<', '=']
    target: RuleTarget;
    apartment: string;
    organization?: string;
    active?: boolean;
    created_at?: Date;
}

export interface RuleSource {
    device: string;
    endpoint: string;
    value: any;
}

export interface RuleTarget {
    device: string;
    endpoint: string;
    value: any;
}