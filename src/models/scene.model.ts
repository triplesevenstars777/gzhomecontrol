export interface Scene {
    _id?: string;
    name: string;
    user: string;
    active: boolean;
    created_at?: Date;
    updated_at?: Date;
    devices: device[];
}

interface device {
    _id?: string;
    id: string;
    active: boolean;
    available: boolean;
    endpoints: endpoint[];
}

interface endpoint {
    _id?: string;
    id: string;
    stateOn: string;
    stateOff: string;
    defaultState: string;
    value: string
}