
export interface User {
    name: string;
    surname: string;
    password?: string;
    is_admin?: boolean;
    is_super_admin?: boolean;
    email: string;
    organization: string;
    groups: UserGroups;
    active?: boolean;
    created_at?: Date;
}

export interface UserGroups {
    buildings: string[];
    apartments: string[];
    rooms: string[];
    devices: string[];
    gateways?: string[];
    cameras?: string[];
}