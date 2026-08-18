import { QueryClient } from '@tanstack/react-query'

// 앱 전역 단일 QueryClient. 캐싱·재요청 정책의 정본이라 훅은 staleTime/gcTime 을 따로 적지 않는다.
//
// 기본값을 아래처럼 잡은 것은 **현재 동작을 바꾸지 않기 위해서**다. 지금 앱은 fetch 를 직접 부르고
// 재시도도 자동 재조회도 하지 않는다. TanStack 기본값(retry 3회, 창 포커스 시 재조회)을 그대로 두면
// 리팩터링만 했는데 네트워크 요청 횟수와 실패까지 걸리는 시간이 달라진다.
//
// staleTime 은 일부러 명시하지 않는다(기본 0). 지금 화면은 항목을 누를 때마다 상세를 새로 받아오므로,
// 0 이어야 그 동작에 가장 가깝다.
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: false,
        },
    },
})
