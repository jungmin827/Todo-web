import { useState } from 'react'
import type { FormEvent } from 'react'
import { createTodo, deleteTodo, getTodo, getTodos, updateTodo } from './api/todo'
import type { TodoResponse } from './types/todo'
import CustomInput from './components/CustomInputs'
import CustomButton from './components/CustomButtons'

export default function App() {
    const [todos, setTodos] = useState<TodoResponse[]>([])
    const [selected, setSelected] = useState<TodoResponse | null>(null)
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [searchId, setSearchId] = useState('')
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [editBody, setEditBody] = useState('')
    const [error, setError] = useState('')

    const run = async (fn: () => Promise<void>) => {
        setError('')
        try {
            await fn()
        } catch (err) {
            setError((err as Error).message)
        }
    }

    const loadAll = () =>
        run(async () => {
            setTodos(await getTodos())
            setSelected(null)
        })

    const handleSearch = (e: FormEvent) => {
        e.preventDefault()
        return run(async () => setSelected(await getTodo(Number(searchId))))
    }

    const handleCreate = (e: FormEvent) => {
        e.preventDefault()
        return run(async () => {
            const created = await createTodo(body.trim() ? { title, body } : { title })
            setTodos((prev) => [...prev, created])
            setTitle('')
            setBody('')
        })
    }

    const handleToggle = (todo: TodoResponse) =>
        run(async () => {
            const updated = await updateTodo(todo.id, { completed: !todo.completed })
            setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
            setSelected((prev) => (prev?.id === updated.id ? updated : prev))
        })

    const startEdit = (todo: TodoResponse) => {
        setEditingId(todo.id)
        setEditTitle(todo.title)
        setEditBody(todo.body ?? '')
    }

    const saveEdit = (id: number) =>
        run(async () => {
            const updated = await updateTodo(id, { title: editTitle, body: editBody })
            setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
            setSelected((prev) => (prev?.id === updated.id ? updated : prev))
            setEditingId(null)
        })

    const handleDelete = (id: number) =>
        run(async () => {
            await deleteTodo(id)
            setTodos((prev) => prev.filter((t) => t.id !== id))
            setSelected((prev) => (prev?.id === id ? null : prev))
        })

    const handleSelect = (id: number) =>
        run(async () => {
            if (selected?.id === id) {
                setSelected(null)
                return
            }
            setSelected(await getTodo(id))
        })

    return (
        <main className="mx-auto max-w-2xl p-6">
            <h1 className="text-xl font-bold">timmy todo</h1>

            <form onSubmit={handleSearch} className="mt-4 flex gap-2">
                <CustomInput
                    type="number"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="id"
                    className="w-24"
                />
                <CustomButton type="submit" disabled={!searchId.trim()}>
                    단건 조회
                </CustomButton>
                <CustomButton onClick={loadAll}>전체 조회</CustomButton>
            </form>

            <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-2">
                <CustomInput
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="할 일"
                />
                <div className="flex gap-2">
                    <CustomInput
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="내용"
                        className="flex-1"
                    />
                    <CustomButton type="submit" disabled={!title.trim()}>
                        등록
                    </CustomButton>
                </div>
            </form>

            {error && <p className="mt-2 text-red-600">{error}</p>}

            <ul className="mt-4 space-y-2">
                {todos.map((todo) => (
                    <li key={todo.id} className="rounded border p-2">
                        {editingId === todo.id ? (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    saveEdit(todo.id)
                                }}
                                className="flex flex-col gap-2"
                            >
                                <CustomInput
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    placeholder="할 일"
                                />
                                <div className="flex gap-2">
                                    <CustomInput
                                        value={editBody}
                                        onChange={(e) => setEditBody(e.target.value)}
                                        placeholder="내용"
                                        className="flex-1"
                                    />
                                    <CustomButton type="submit" disabled={!editTitle.trim()}>
                                        저장
                                    </CustomButton>
                                    <CustomButton onClick={() => setEditingId(null)}>취소</CustomButton>
                                </div>
                            </form>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="shrink-0 text-gray-500">#{todo.id}</span>
                                <input
                                    type="checkbox"
                                    checked={todo.completed}
                                    onChange={() => handleToggle(todo)}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleSelect(todo.id)}
                                    className={`flex-1 text-left ${todo.completed ? 'line-through' : ''}`}
                                >
                                    {todo.title}
                                </button>
                                <CustomButton onClick={() => startEdit(todo)}>수정</CustomButton>
                                <CustomButton onClick={() => handleDelete(todo.id)}>삭제</CustomButton>
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            {selected && (
                <section className="mt-4 rounded border p-3 text-sm">
                    <p className="font-bold">
                        #{selected.id} {selected.title}
                    </p>
                    <p className="mt-1">{selected.body || '(본문 없음)'}</p>
                    <p className="mt-2 text-gray-500">생성 {selected.createdDate}</p>
                    <p className="text-gray-500">수정 {selected.modifiedDate}</p>
                    <p className="text-gray-500">{selected.url}</p>
                </section>
            )}
        </main>
    )
}
