import 'reflect-metadata'
import { container, type InjectionToken } from 'tsyringe'

let ready = false

/**
 * 앱 부팅 표시. main.tsx 가 createRoot 이전에 정확히 한 번 부른다.
 *
 * ⚠️ **지금 이 함수는 아무것도 등록하지 않는다.** 클래스 토큰을 쓰는 것들(`ApiClient`,
 * 도메인 Repository)은 전부 `@singleton()` 자가등록이라 등록이 **모듈 평가 시점**에 끝난다.
 * 토큰을 참조하려면 그 모듈을 import 해야 하므로, 등록 누락이라는 실패 자체가 성립하지 않는다.
 *
 * 그래도 함수를 남기는 이유는 둘이다.
 *  · 아래 `resolve` 의 부팅 순서 가드가 기댈 지점 — 모듈 평가 도중(렌더 이전)에 resolve 하는
 *    코드를 막는다. 그런 호출은 등록 여부와 무관하게 설계상 있으면 안 된다.
 *  · 토큰과 구현이 분리되는 등록(string 토큰, 플랫폼 분기)이 생기면 그것들이 들어올 자리다.
 *    그때는 자가등록이 불가능해 명시 등록 모듈이 필요하다.
 *
 * 두 번 부르는 것을 막는 것은 그 부팅 지점이 하나임을 강제하기 위해서다.
 */
export function setupDIContainer(): void {
    if (ready) {
        throw new Error('[DI] setupDIContainer() 가 두 번 호출됐다. 부팅 지점은 하나여야 한다.')
    }
    ready = true
}

/**
 * 의존성 조회. 소비처는 tsyringe 의 `container` 를 직접 import 하지 않고 이 함수를 쓴다.
 *
 * 막으려는 것은 tsyringe 가 미등록 `@injectable()` 클래스도 resolve 해 주는 데서 나오는
 * 침묵 실패다 — 등록돼 있지 않으면 에러 대신 **호출마다 새 인스턴스**가 나오고, 렌더마다
 * 다른 객체가 되어 useMemo/useCallback 메모이제이션이 전부 무효화된다. 빌드 신호도 없다.
 *
 * `@singleton()` 을 쓰는 지금은 이 경로로 새는 것이 없지만, 가드는 남긴다 —
 * `@singleton()` 을 빠뜨린 클래스나 등록이 필요한 string 토큰이 들어오는 순간 다시 유효해진다.
 */
export function resolve<T>(token: InjectionToken<T>): T {
    if (!ready) {
        throw new Error('[DI] setupDIContainer() 이전에 resolve 가 호출됐다. main.tsx 의 호출 순서를 확인하라.')
    }
    if (!container.isRegistered(token)) {
        const name = typeof token === 'function' ? token.name : String(token)
        throw new Error(
            `[DI] "${name}" 이(가) 등록돼 있지 않다. 클래스라면 \`@singleton()\` 이 붙어 있는지, ` +
                'string 토큰이라면 등록 모듈이 있는지 확인하라.',
        )
    }
    return container.resolve(token)
}
