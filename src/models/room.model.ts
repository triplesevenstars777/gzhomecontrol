export interface Room {
    name: string;
    info: string;
    type: string;
    building:any;
    apartment: any;
    groups: string[];
    organization?:string;
    active?: boolean;
    created_at?: Date;
}