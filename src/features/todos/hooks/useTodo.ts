import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDI } from '../../../core/hooks/useDI'
import { TodoRepository } from '../repositories/todoRepository'
import { todoKeys } from './todoKeys'
import type { TodoInsertDto, TodoListParams, TodoUpdateDto } from '../types/todoTypes'

// Todo Query 훅 — 4단 체인(Screen → ViewModel → **Query 훅** → Repository)의 3단.
//
// 이 계층의 규약:
//  · **Repository 를 resolve 하는 것은 이 계층뿐이다.** ViewModel/Screen 에서 useDI(Repository) 를
//    부르면 그쪽 위반이다. 이 한 줄이 4단 체인의 핵심이고 나머지는 이걸 지키기 위한 부수 규칙이다.
//  · queryKey/mutationKey 는 `todoKeys` 팩토리에서만 만든다.
//  · staleTime/gcTime 을 여기 적지 않는다 — 전역 기본값(core/config/queryClient.ts)을 상속한다.
//  · `refetch` 를 노출하지 않는다. 무효화(`refresh*`)만 내보낸다 — 이름이 한 글자 차이라 섞이면
//    강제 재요청과 무효화를 구분 없이 쓰게 된다.
//  · **화면을 모른다.** 어느 화면이 이걸 쓰는지 이 파일은 알 필요가 없다.

export interface UseTodoOptions {
    /**
     * 목록 조회 파라미터.
     *
     * ⚠️ 호출부는 **모듈 상수**를 넘겨야 한다. 훅 인자로 `{ size: 20 }` 을 인라인으로 쓰면
     *    렌더마다 새 객체가 되고, 그 객체가 그대로 queryKey 에 들어가 매 렌더 다른 키가 된다
     *    → 무한 재요청.
     */
    params?: TodoListParams
    /**
     * 목록 조회 게이트.
     *
     * 이 화면은 `전체 조회` 버튼을 누르기 전에는 목록을 조회하지 않는다. useQuery 는 마운트에
     * 자동으로 나가므로, 그 동작을 유지하려면 게이트가 필요하다.
     * (인가 경계였다면 호출부 옵션으로 두지 않고 훅이 직접 판단해야 한다 — 여기선 인가가 아니라
     *  "요청형 조회"라는 화면의 의도라 옵션이 맞다.)
     */
    listEnabled?: boolean
    /** 상세 조회 대상. null 이면 상세 쿼리가 나가지 않는다. */
    detailIdx?: number | null
}

export interface TodoUpdateVariables {
    idx: number
    dto: TodoUpdateDto
}

export const useTodo = ({ params, listEnabled = true, detailIdx = null }: UseTodoOptions = {}) => {
    const todoRepository = useDI(TodoRepository)
    const queryClient = useQueryClient()

    const todoListQuery = useQuery({
        queryKey: todoKeys.list(params),
        queryFn: () => todoRepository.getTodoList(params),
        enabled: listEnabled,
    })

    const todoDetailQuery = useQuery({
        // detailIdx 가 null 인 동안은 enabled 가 false 라 queryFn 이 실행되지 않는다.
        queryKey: todoKeys.detail(detailIdx!),
        queryFn: () => todoRepository.getTodoByIdx(detailIdx!),
        // ⚠️ `!!detailIdx` 가 아니라 `!= null` 이다. `!!` 는 0 을 막는다 —
        //    지금 이 서버의 idx 는 1 부터라 당장 문제되지 않지만, 0 이 유효한 식별자가 되는 순간
        //    "특정 항목만 상세가 안 열린다"는 형태로 나타나 원인을 찾기 어렵다.
        enabled: detailIdx != null,
    })

    const insertTodoMutation = useMutation({
        mutationKey: todoKeys.insert(),
        mutationFn: (dto: TodoInsertDto) => todoRepository.insertTodo(dto),
        onSuccess: () => {
            // 응답으로 생성된 Todo 전체가 오지만 캐시에 직접 붙이지 않는다.
            // 목록의 **정렬과 총건수는 서버가 소유**한다 — 앱이 배열 앞뒤에 끼워 넣기 시작하면
            // 서버의 정렬 규칙과 totalElements 를 앱이 흉내내게 된다.
            queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
        },
    })

    const updateTodoMutation = useMutation({
        mutationKey: todoKeys.update(),
        mutationFn: ({ idx, dto }: TodoUpdateVariables) => todoRepository.updateTodoByIdx(idx, dto),
        onSuccess: (updated) => {
            // 응답이 곧 갱신된 전체 상태라 상세는 재요청 없이 캐시에 직접 꽂는다.
            // 무효화만 하면 저장 직후 화면이 잠깐 옛 값으로 남았다가 바뀐다.
            queryClient.setQueryData(todoKeys.detail(updated.idx), updated)
            // 목록은 무효화한다 — 항목 내용이 바뀌었고, 그 목록의 주인은 서버다.
            queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
        },
    })

    const deleteTodoMutation = useMutation({
        mutationKey: todoKeys.remove(),
        mutationFn: (idx: number) => todoRepository.deleteTodoByIdx(idx),
        onSuccess: (_result, idx) => {
            // 지운 항목의 상세 캐시는 무효화가 아니라 제거다. 무효화하면 없는 idx 로 재요청이 나가 404 가 된다.
            queryClient.removeQueries({ queryKey: todoKeys.detail(idx) })
            queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
        },
    })

    // `data?.content ?? []` 를 그대로 쓰면 매 렌더 새 배열이라, 이걸 의존성 배열에 넣은
    // 소비처의 useMemo/useEffect 가 전부 매 렌더 재실행된다. 참조 고정은 데이터 훅의 책임이다.
    const todos = useMemo(() => todoListQuery.data?.content ?? [], [todoListQuery.data])

    const refreshTodos = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
    }, [queryClient])

    const refreshTodoDetail = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: todoKeys.details() })
    }, [queryClient])

    return {
        // Mutations
        insertTodo: insertTodoMutation.mutateAsync,
        updateTodoByIdx: updateTodoMutation.mutateAsync,
        deleteTodoByIdx: deleteTodoMutation.mutateAsync,

        // 데이터
        todos,
        todoPage: todoListQuery.data?.page,
        todoDetail: todoDetailQuery.data,

        // 로딩
        isLoadingTodos: todoListQuery.isLoading,
        isLoadingTodoDetail: todoDetailQuery.isLoading,
        isInsertingTodo: insertTodoMutation.isPending,
        isUpdatingTodo: updateTodoMutation.isPending,
        isDeletingTodo: deleteTodoMutation.isPending,

        // 에러
        todoListError: todoListQuery.error,
        todoDetailError: todoDetailQuery.error,

        // 캐시 무효화 — 강제 재요청(refetch)은 노출하지 않는다.
        refreshTodos,
        refreshTodoDetail,
    }
}
