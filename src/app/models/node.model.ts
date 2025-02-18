export interface Node {
    _id?: string;
    name: string; //change
    location?: Location; //change
    address: string; //change
    gateway?: string;
    building: string;
    apartment: string; //change
    room: any; //change
    groups: string[];
    public?: boolean;
    unlinked?: boolean;
    organization?: string;
    last_update?:string;
    periodicity?:number;
    active?: boolean; //change
    status?:string;
    uid?: Uid;
    scheme?: Scheme;
    created_at?: Date;
}

interface Uid {
    id: string,
    code: string,
    full: string,
}

interface Scheme {
    parent: string;
    name: string;
    code: string;
    endpoints: Endpoint[];
}

export interface Endpoint {
    _id?: string;
    name: string;
    display_name: string;
    type: 'stateless' | 'stateful';
    dir: 'input' | 'output' | 'i/o';
    id: string;
    pathname: string;
    value: Value;
    current?: any;
    states: State[];
}

interface Value {
    max: number;
    min: number;
}

interface State {
    name: string;
    value: any;
}

interface Location {
    coordinates: any;
}
