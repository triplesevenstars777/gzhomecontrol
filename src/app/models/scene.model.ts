export interface Scene{
    name:string;
    user:string;
    active:boolean;
    created_at?: Date;
    updated_at?: Date;
    devices:device[];
}

interface device {
    id:string;
    active:boolean;
    available: boolean;
    endpoints:endpoint[];
}

interface endpoint {
    id:string;
    stateOn:string;
    stateOff:string;
    defaultState:string;
    value:string
}