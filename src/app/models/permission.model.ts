export interface Permission {
    user: string;
    role: string;
    building: string;
    apartment: string;
    room: string;
}

export enum Roles {
    APARTMENT_MANAGER = 'apartment_manager',
    BUILDING_MANAGER = 'building_manager',
    INSTALLER = 'installer'
}