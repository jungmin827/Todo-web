import { useTodoScreen } from '../hooks/useTodoScreen'
import CustomInput from '../../../components/CustomInputs'
import CustomButton from '../../../components/CustomButtons'

// Todo 화면 — 4단 체인의 1단. props 를 받지 않고 `useTodoScreen()` 하나만 부른다.
// JSX 에는 `vm.xxx` 참조와 조건부 렌더·map 만 둔다. 계산이 필요하면 ViewModel 로 올린다.
export default function TodoScreen() {
    const vm = useTodoScreen()

    return (
        <main className="mx-auto max-w-2xl p-6">
            <h1 className="text-xl font-bold">timmy todo</h1>

            <form onSubmit={vm.submitSearch} className="mt-4 flex gap-2">
                <CustomInput
                    type="number"
                    value={vm.searchId}
                    onChange={vm.changeSearchId}
                    placeholder="id"
                    className="w-24"
                />
                <CustomButton type="submit" disabled={!vm.canSearch}>
                    단건 조회
                </CustomButton>
                <CustomButton onClick={vm.loadAll}>전체 조회</CustomButton>
            </form>

            <form onSubmit={vm.submitCreate} className="mt-4 flex flex-col gap-2">
                <CustomInput value={vm.title} onChange={vm.changeTitle} placeholder="할 일" />
                <div className="flex gap-2">
                    <CustomInput
                        value={vm.body}
                        onChange={vm.changeBody}
                        placeholder="내용"
                        className="flex-1"
                    />
                    <CustomButton type="submit" disabled={!vm.canCreate}>
                        등록
                    </CustomButton>
                </div>
            </form>

            {vm.error && <p className="mt-2 text-red-600">{vm.error}</p>}

            <ul className="mt-4 space-y-2">
                {vm.todos.map((todo) => (
                    <li key={todo.idx} className="rounded border p-2">
                        {vm.editingIdx === todo.idx ? (
                            <form onSubmit={vm.submitEdit} className="flex flex-col gap-2">
                                <CustomInput
                                    value={vm.editTitle}
                                    onChange={vm.changeEditTitle}
                                    placeholder="할 일"
                                />
                                <div className="flex gap-2">
                                    <CustomInput
                                        value={vm.editBody}
                                        onChange={vm.changeEditBody}
                                        placeholder="내용"
                                        className="flex-1"
                                    />
                                    <CustomButton type="submit" disabled={!vm.canSaveEdit}>
                                        저장
                                    </CustomButton>
                                    <CustomButton onClick={vm.cancelEdit}>취소</CustomButton>
                                </div>
                            </form>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="shrink-0 text-gray-500">#{todo.idx}</span>
                                <input
                                    type="checkbox"
                                    checked={todo.completed}
                                    onChange={() => vm.toggleCompleted(todo)}
                                />
                                <button
                                    type="button"
                                    onClick={() => vm.selectTodo(todo.idx)}
                                    className={`flex-1 text-left ${todo.completed ? 'line-through' : ''}`}
                                >
                                    {todo.title}
                                </button>
                                <CustomButton onClick={() => vm.startEdit(todo)}>수정</CustomButton>
                                <CustomButton onClick={() => vm.removeTodo(todo.idx)}>삭제</CustomButton>
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            {vm.selected && (
                <section className="mt-4 rounded border p-3 text-sm">
                    <p className="font-bold">
                        #{vm.selected.idx} {vm.selected.title}
                    </p>
                    <p className="mt-1">{vm.selectedBodyLabel}</p>
                    <p className="mt-2 text-gray-500">생성 {vm.selected.registerDate}</p>
                    <p className="text-gray-500">수정 {vm.selected.modifyDate}</p>
                </section>
            )}
        </main>
    )
}
