import type { TodoListParams } from '../types/todoTypes'

// Todo 도메인의 queryKey / mutationKey 를 만드는 유일한 곳.
//
// 왜 팩토리인가: 키를 리터럴로 훅에 흩뿌리면 `['todo','list']` 를 `['todos','list']` 로 오타 내도
// 컴파일이 통과한다. 그러면 조회는 멀쩡히 되는데 **무효화만 조용히 안 먹는다** — 등록 후 목록이
// 안 바뀌는 형태로 나타나서 원인을 캐시가 아니라 서버나 응답에서 찾게 된다.
//
// 규약:
//  · **복수형 무인자(`lists`/`details`)는 무효화 범위**, **단수형 유인자(`list`/`detail`)는 실제 쿼리 키**다.
//    `invalidateQueries({ queryKey: todoKeys.lists() })` 는 접두사 매칭이라 params 가 다른 목록 캐시까지 훑는다.
//  · 모든 반환에 `as const` — 튜플로 좁혀야 키 구조가 타입에 남는다.
//  · mutationKey 도 여기서 가져온다.

export const todoKeys = {
    all: ['todo'] as const,

    // 목록
    lists: () => [...todoKeys.all, 'list'] as const,
    list: (params?: TodoListParams) => [...todoKeys.lists(), params] as const,

    // 상세
    details: () => [...todoKeys.all, 'detail'] as const,
    detail: (idx: number) => [...todoKeys.details(), idx] as const,

    // mutation
    insert: () => [...todoKeys.all, 'insert'] as const,
    update: () => [...todoKeys.all, 'update'] as const,
    remove: () => [...todoKeys.all, 'remove'] as const,
}
