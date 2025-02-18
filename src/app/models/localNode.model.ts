export interface LocalNode {
    stateArrive?: boolean
    stateLeave?: boolean
    endpoints?: [
        {
            stateOn?: any
            stateOff?: any
            data?: {
                device: string
                endpoint: string
                value: any
            }
        }
    ]
}