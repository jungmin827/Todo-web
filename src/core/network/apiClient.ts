import { singleton } from 'tsyringe'
import { DefaultError } from '../error/defaultError'

// HTTP 경계. 앱에서 fetch 를 직접 부르는 곳은 이 파일 하나다.
//
// axios 를 넣지 않았다 — 이 서버에는 인증도 토큰 재발급도 없어서 인터셉터가 할 일이
// (1) 공통 헤더 (2) 에러 정규화 둘뿐이고, 그건 fetch 로도 같은 자리에 넣을 수 있다.
//
// 여기가 지는 책임 3가지. Repository 가 이걸 대신 하기 시작하면 메서드마다 중복된다:
//  · X-API-VERSION 헤더 — 이 서버는 **모든** 엔드포인트가 이 헤더를 요구한다.
//    없으면 매핑에 걸리지 않아 404 다(400 이 아니라서 원인을 찾기 어렵다).
//  · 쿼리 직렬화 — 배열은 `sort=idx,asc&sort=title,asc` 처럼 **같은 키를 반복**해야 한다.
//    `sort[]=` 형태로 나가면 Spring 의 Pageable 이 조용히 무시하고 정렬 안 된 첫 페이지를 준다.
//  · 에러 정규화 — 응답 본문 언랩과 에러 변환이 여기서 끝나므로 Repository 는 `.data` 를
//    다시 벗기지 않고, 위 계층은 항상 DefaultError 만 본다.

const API_VERSION = '1'

type QueryValue = string | number | boolean | readonly (string | number)[] | undefined | null

export type QueryParams = Record<string, QueryValue>

export interface RequestConfig {
    params?: QueryParams
}

function toQueryString(params?: QueryParams): string {
    if (!params) return ''

    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue
        if (Array.isArray(value)) {
            // 같은 키를 반복해서 append 한다 (위 주석의 sort 규칙).
            for (const item of value) {
                if (item === undefined || item === null) continue
                search.append(key, String(item))
            }
            continue
        }
        search.append(key, String(value))
    }

    const query = search.toString()
    return query ? `?${query}` : ''
}

async function request<T>(method: string, url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    let response: Response
    try {
        response = await fetch(`${url}${toQueryString(config?.params)}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-API-VERSION': API_VERSION,
            },
            body: data === undefined ? undefined : JSON.stringify(data),
        })
    } catch (error) {
        // 여기 오는 것은 네트워크 실패뿐이다 — fetch 는 4xx/5xx 로는 reject 하지 않는다.
        throw DefaultError.fromUnknown(error)
    }

    if (!response.ok) throw DefaultError.fromResponse(response)

    // 본문 없는 응답(204 또는 빈 바디)을 undefined 로 돌려준다. `res.json()` 은 빈 바디에서 throw 한다.
    const text = await response.text()
    return (text ? JSON.parse(text) : undefined) as T
}

// `@singleton()` = `injectable()` + `container.registerSingleton()`. 등록이 별도 모듈의
// 런타임 호출이 아니라 **이 모듈이 평가되는 시점**에 끝난다. 토큰이 클래스 자신이라
// `useDI(ApiClient)` 를 쓰려면 이 모듈을 import 해야 하고, 그 순간 이미 등록돼 있다.
@singleton()
export class ApiClient {
    async get<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
        return request<T>('GET', url, undefined, config)
    }

    async post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
        return request<T>('POST', url, data, config)
    }

    async put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
        return request<T>('PUT', url, data, config)
    }

    async delete<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
        return request<T>('DELETE', url, undefined, config)
    }
}
