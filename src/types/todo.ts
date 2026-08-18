export interface TodoResponse {
    id: number
    title: string
    body?: string
    completed: boolean
    createdDate: string
    modifiedDate: string
    url: string
}

export interface TodoRequest {
    title?: string
    body?: string
    completed?: boolean
}
