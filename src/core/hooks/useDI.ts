import { useMemo } from 'react'
import type { InjectionToken } from 'tsyringe'
import { resolve } from '../di/container'

/**
 * 훅 본문에서 의존성을 주입받는 표준 경로.
 *
 * `resolve()` 를 훅 본문에서 그대로 부르면 렌더마다 컨테이너를 조회하고, 그 반환값이
 * useMemo/useCallback 의존성 배열에 들어간다. 등록된 싱글턴이면 참조가 같아 우연히 안정적이지만,
 * 그건 규약이 아니라 등록 상태에 딸린 성질이다. useMemo 로 한 겹 받쳐 둔다.
 *
 * 토큰은 모듈 상수(클래스 참조)라 렌더 간 안정적이므로 의존성 배열에 그대로 넣는다.
 */
export function useDI<T>(token: InjectionToken<T>): T {
    return useMemo(() => resolve(token), [token])
}
