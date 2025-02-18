export interface Actuator {
    device: string;
    endpoint: string;
    value: number | string;
    status?: 'pending' | 'fulfilled';
    created_at?: Date
}