export interface Apartment {
    _id?:string;
    name: string;
    info: string;
    state: 'available'|'occupied'|'other';
    type: 'double'|'single'|'suite';
    building: string;
    groups: string[];
    active?: boolean;
    organization?: string;
    created_at?: Date;
}