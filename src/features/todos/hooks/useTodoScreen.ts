import { useCallback, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useTodo } from './useTodo'
import type { TodoInsertDto, TodoListParams, TodoResponseDto } from '../types/todoTypes'

// Todo 화면의 ViewModel — 4단 체인의 2단. 화면이 필요한 모든 것을 여기서 만들어 내보낸다.
//
// 이 계층의 규약:
//  · `useDI(Repository)` 금지. Repository 는 Query 훅(useTodo)만 resolve 한다.
//  · `useQuery`/`useMutation` 직접 사용 금지, queryKey 조작 금지.
//  · 화면 로컬 state / 이벤트 핸들러 / 폼→DTO 변환 / 표시용 파생값이 여기 산다.

/**
 * 목록 조회 파라미터. **모듈 최상단 상수다.**
 *
 * 훅 인자로 `{ size: 100 }` 을 인라인으로 넘기면 렌더마다 새 객체가 되고, 그 객체가 그대로
 * queryKey 에 들어가 매 렌더 다른 키가 된다 → 무한 재요청.
 *
 * · `size: 100` — 화면에 페이지네이션 UI 가 없다. 서버 기본값 20 을 그대로 두면 21번째부터
 *   화면에서 사라진다(서버 최대 2000).
 * · `sort: ['idx,asc']` — **명시해야 한다.** 서버는 정렬 미지정 시 `idx DESC`(최신순)를 준다
 *   (`TodoCustomRepositoryImpl.toOrderSpecifiers`). 지금 화면은 새 항목이 목록 **아래**에
 *   붙는 순서라, 명시하지 않으면 순서가 뒤집힌다.
 */
const TODO_LIST_PARAMS: TodoListParams = { size: 100, sort: ['idx,asc'] }

// 서버 제약(참고): title 은 @NotBlank + 최대 200자, body 는 최대 2000자.
// ⚠️ 지금 화면은 길이 검증을 하지 않고 서버 400 을 그대로 보여 준다. 이 리팩터링에서는
//    동작을 바꾸지 않기 위해 검증을 **추가하지 않았다**. 넣는다면 그 자리는 여기다.

export function useTodoScreen() {
    // ── 화면 로컬 state ────────────────────────────────────────────────────────
    const [searchId, setSearchId] = useState('')
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [editingIdx, setEditingIdx] = useState<number | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [editBody, setEditBody] = useState('')
    const [actionError, setActionError] = useState('')

    // 상세 패널의 대상. 서버 데이터 자체는 useTodo 가 캐시로 들고 있고, 여기는 "무엇을 보고 있는가"만 쥔다.
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

    // 목록 조회 게이트. 이 화면은 `전체 조회` 를 누르기 전에는 목록을 조회하지 않는다.
    const [isListRequested, setIsListRequested] = useState(false)

    const {
        todos,
        todoDetail,
        todoListError,
        todoDetailError,
        insertTodo,
        updateTodoByIdx,
        deleteTodoByIdx,
        refreshTodos,
    } = useTodo({
        params: TODO_LIST_PARAMS,
        listEnabled: isListRequested,
        detailIdx: selectedIdx,
    })

    /**
     * 기존 `App.tsx` 의 `run()` 을 그대로 옮긴 것. 액션 시작 시 에러를 비우고, 실패하면 메시지를 채운다.
     * 문구는 `DefaultError` 가 만든 `"404 Not Found"` 형태다(기존과 동일).
     */
    const run = useCallback(async (fn: () => Promise<void>) => {
        setActionError('')
        try {
            await fn()
        } catch (error) {
            setActionError((error as Error).message)
        }
    }, [])

    // ── 이벤트 핸들러 ─────────────────────────────────────────────────────────

    /** 전체 조회. 목록 게이트를 열고, 상세 패널은 닫는다(기존 `loadAll` 동작). */
    const loadAll = useCallback(() => {
        setActionError('')
        setSelectedIdx(null)
        setIsListRequested(true)
        // 이미 게이트가 열려 있으면 상태가 안 바뀌어 재조회가 일어나지 않는다. 무효화로 다시 부른다.
        refreshTodos()
    }, [refreshTodos])

    /** 단건 조회 — 입력한 id 를 상세 대상으로 삼는다. 실제 요청은 useTodo 의 상세 쿼리가 보낸다. */
    const submitSearch = useCallback((event: FormEvent) => {
        event.preventDefault()
        setActionError('')
        setSelectedIdx(Number(searchId))
    }, [searchId])

    /** 등록. 성공하면 입력을 비운다. */
    const submitCreate = useCallback(
        (event: FormEvent) => {
            event.preventDefault()
            return run(async () => {
                // ⚠️ 내용이 비어 있으면 `body` 키 **자체를 넣지 않는다**(기존 분기 그대로).
                //    서버는 필드 부재와 빈 문자열을 다르게 저장한다.
                //    검사만 trim 으로 하고 값은 입력 원문을 보낸다 — 이것도 기존과 같다.
                const dto: TodoInsertDto = body.trim() ? { title, body } : { title }
                await insertTodo(dto)
                setTitle('')
                setBody('')
            })
        },
        [body, insertTodo, run, title],
    )

    /** 완료 토글. 부분 수정이라 `completed` 하나만 보낸다. */
    const toggleCompleted = useCallback(
        (todo: TodoResponseDto) =>
            run(async () => {
                await updateTodoByIdx({ idx: todo.idx, dto: { completed: !todo.completed } })
            }),
        [run, updateTodoByIdx],
    )

    const startEdit = useCallback((todo: TodoResponseDto) => {
        setEditingIdx(todo.idx)
        setEditTitle(todo.title)
        setEditBody(todo.body ?? '')
    }, [])

    const cancelEdit = useCallback(() => {
        setEditingIdx(null)
    }, [])

    /**
     * 수정 저장.
     *
     * ⚠️ 등록과 달리 `body` 를 **항상 보낸다**(빈 문자열이어도). 기존 `saveEdit` 이 그랬다.
     *    두 규칙이 다른 것이 어색해 보여도 통일하지 않는다 — 통일하는 순간 동작이 바뀐다.
     */
    const submitEdit = useCallback(
        (event: FormEvent) => {
            event.preventDefault()
            if (editingIdx == null) return
            const idx = editingIdx
            return run(async () => {
                await updateTodoByIdx({ idx, dto: { title: editTitle, body: editBody } })
                setEditingIdx(null)
            })
        },
        [editBody, editTitle, editingIdx, run, updateTodoByIdx],
    )

    /** 삭제. 보고 있던 항목이 지워지면 상세 패널을 닫는다. */
    const removeTodo = useCallback(
        (idx: number) =>
            run(async () => {
                await deleteTodoByIdx(idx)
                setSelectedIdx((prev) => (prev === idx ? null : prev))
            }),
        [deleteTodoByIdx, run],
    )

    /** 제목 클릭 — 같은 항목을 다시 누르면 닫고, 아니면 그 항목을 연다(기존 `handleSelect`). */
    const selectTodo = useCallback((idx: number) => {
        setActionError('')
        setSelectedIdx((prev) => (prev === idx ? null : idx))
    }, [])

    // ── 폼 입력 ───────────────────────────────────────────────────────────────
    // 값 추출(`e.target.value`)을 여기서 끝낸다. JSX 에는 `vm.xxx` 참조만 남는다.
    const changeSearchId = useCallback((e: ChangeEvent<HTMLInputElement>) => setSearchId(e.target.value), [])
    const changeTitle = useCallback((e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value), [])
    const changeBody = useCallback((e: ChangeEvent<HTMLInputElement>) => setBody(e.target.value), [])
    const changeEditTitle = useCallback((e: ChangeEvent<HTMLInputElement>) => setEditTitle(e.target.value), [])
    const changeEditBody = useCallback((e: ChangeEvent<HTMLInputElement>) => setEditBody(e.target.value), [])

    // ── 표시용 파생값 ─────────────────────────────────────────────────────────
    // 화면 하나에 에러 자리가 하나뿐이라 세 출처를 여기서 합친다.
    // 액션(mutation) 오류가 우선이고, 없으면 조회 오류를 보여 준다.
    const error = actionError || todoListError?.message || todoDetailError?.message || ''

    return {
        // 목록
        todos,

        // 상세
        selected: todoDetail,
        selectedBodyLabel: todoDetail?.body || '(본문 없음)',

        // 폼 state
        searchId,
        title,
        body,
        editingIdx,
        editTitle,
        editBody,

        // 폼 입력
        changeSearchId,
        changeTitle,
        changeBody,
        changeEditTitle,
        changeEditBody,

        // 버튼 활성 조건
        canSearch: searchId.trim() !== '',
        canCreate: title.trim() !== '',
        canSaveEdit: editTitle.trim() !== '',

        // 이벤트
        loadAll,
        submitSearch,
        submitCreate,
        toggleCompleted,
        startEdit,
        cancelEdit,
        submitEdit,
        removeTodo,
        selectTodo,

        // 에러
        error,
    }
}
