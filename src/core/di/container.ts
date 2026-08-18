import 'reflect-metadata'
import { container, type InjectionToken } from 'tsyringe'
import { setupNetworkModule } from './modules/networkModule'
import { setupRepositoryModule } from './modules/repositoryModule'

let ready = false

/**
 * DI 컨테이너 초기화. main.tsx 가 createRoot 이전에 정확히 한 번 부른다.
 *
 * 두 번 부르는 것을 막는 이유: registerSingleton 은 기존 등록을 덮어쓴다. 두 번째 호출이
 * 싱글턴을 새 인스턴스로 갈아치우고, 이전 인스턴스를 붙잡고 있던 쪽은 경고도 예외도 없이
 * 다른 객체를 보게 된다. 지금은 모듈 스코프 1회 호출이라 안전하지만, 이 호출이 useEffect 로
 * 옮겨지는 순간 StrictMode 의 effect 이중 실행으로 바로 재현된다.
 */
export function setupDIContainer(): void {
    if (ready) {
        throw new Error('[DI] setupDIContainer() 가 두 번 호출됐다. 재등록은 기존 싱글턴을 조용히 버린다.')
    }
    setupNetworkModule()
    setupRepositoryModule()
    ready = true
}

/**
 * 의존성 조회. 소비처는 tsyringe 의 `container` 를 직접 import 하지 않고 이 함수를 쓴다.
 *
 * 막으려는 것은 tsyringe 가 `@injectable()` 클래스를 **등록 없이도** resolve 해 주는 데서
 * 나오는 침묵 실패 2종이다. 등록 전에는 호출마다 새 인스턴스가 나온다.
 *   (1) 초기화 전 resolve — 버려질 인스턴스를 받는다.
 *   (2) 등록 누락 — 에러 없이 렌더마다 새 인스턴스가 만들어져 메모이제이션이 전부 무효화된다.
 * 둘 다 빌드 신호를 남기지 않으므로 여기서 시끄럽게 죽인다.
 */
export function resolve<T>(token: InjectionToken<T>): T {
    if (!ready) {
        throw new Error('[DI] setupDIContainer() 이전에 resolve 가 호출됐다. main.tsx 의 호출 순서를 확인하라.')
    }
    if (!container.isRegistered(token)) {
        const name = typeof token === 'function' ? token.name : String(token)
        throw new Error(`[DI] "${name}" 이(가) 등록돼 있지 않다. core/di/modules/ 를 확인하라.`)
    }
    return container.resolve(token)
}
