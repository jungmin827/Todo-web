// 서버 엔드포인트 정본. Repository 는 경로를 직접 적지 않고 여기를 참조한다.
//
// 경로가 Repository 안에 흩어져 있으면 서버가 경로를 바꿨을 때 고칠 자리가 메서드 수만큼 늘어나고,
// 한 군데를 빠뜨려도 컴파일은 통과한다. 실제로 이 프로젝트가 그 상태였다 —
// 서버는 `/api/todos` 로 옮겨갔는데 클라이언트는 `/todo` 에 멈춰 있었다.
export const API_ENDPOINTS = {
    TODOS: {
        BASE: '/api/todos',
        DETAIL: (idx: number) => `/api/todos/${idx}`,
    },
} as const
