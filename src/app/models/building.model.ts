export interface Building {
    _id?:string;
    info: string;
    name: string;
    city: string;
    address: string;
    active?: string;
    organization?: string;
    location?: any;
    groups: string[];
    created_at?: Date
}