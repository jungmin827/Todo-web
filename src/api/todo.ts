import type { TodoRequest, TodoResponse } from '../types/todo'

const BASE = '/todo'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...init,
    })
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    return res.status === 204 ? (undefined as T) : res.json()
}

export const getTodos = () => request<TodoResponse[]>(BASE)

export const getTodo = (id: number) => request<TodoResponse>(`${BASE}/${id}`)

export const createTodo = (body: TodoRequest & { title: string }) =>
    request<TodoResponse>(BASE, { method: 'POST', body: JSON.stringify(body) })

export const updateTodo = (id: number, body: TodoRequest) =>
    request<TodoResponse>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(body) })

export const deleteTodo = (id: number) =>
    request<void>(`${BASE}/${id}`, { method: 'DELETE' })
