import { inject, singleton } from 'tsyringe'
import { ApiClient } from '../../../core/network/apiClient'
import { API_ENDPOINTS } from '../../../core/config/apiEndpoints'
import { DefaultError } from '../../../core/error/defaultError'
import type { VoidResultType } from '../../../core/types/commonTypes'
import type {
    TodoInsertDto,
    TodoListParams,
    TodoListResponse,
    TodoResponseDto,
    TodoUpdateDto,
} from '../types/todoTypes'

// Todo Repository — 서버 `/api/todos` 호출만 한다.
//
// 이 파일이 지키는 규약:
//  · `@singleton()` 자가등록. 별도 등록 모듈을 두지 않는다.
//    토큰이 클래스 자신이라 **토큰을 참조하려면 이 모듈을 import 해야 하고, import 하는 순간
//    등록이 끝난다** — "등록 전에 resolve" 가 성립할 수 없다. 등록 모듈이 필요한 것은 토큰과
//    구현이 분리되는 경우(string 토큰, 플랫폼 분기)뿐이다.
//    core/di 가 feature 를 import 하지 않게 되는 효과도 같이 얻는다.
//  · `ApiClient` 는 **값 import** 다. `import type` 으로 바꾸면 데코레이터 메타데이터가
//    `Object` 로 낮아진다(0단계 spike 에서 변환 결과로 확인했다).
//  · 경로는 API_ENDPOINTS 를 통해서만 참조한다.
//  · 인증/버전 헤더를 여기서 만들지 않는다 — `X-API-VERSION` 은 ApiClient 가 붙인다.
//  · ApiClient 가 응답 본문(`Promise<T>`)을 돌려주므로 여기서 다시 언랩하지 않는다.
//  · React·TanStack Query 를 import 하지 않는다. 훅도 상태도 없다.
//
// catch 의 `DefaultError.fromUnknown` 은 사실상 no-op 이다(ApiClient 가 이미 정규화한다).
// 그래도 두는 이유는 이 경계를 지나온 에러의 타입이 **항상** DefaultError 임을 이 계층이
// 스스로 보장하기 위해서다 — 나중에 ApiClient 를 갈아끼워도 위 계층의 분기가 안 깨진다.

@singleton()
export class TodoRepository {
    // ⚠️ 파라미터 프로퍼티(`constructor(private readonly apiClient: ApiClient)`)를 쓸 수 없다.
    //    tsconfig 의 `erasableSyntaxOnly` 가 막는다(TS1294). 필드를 따로 선언해 대입한다.
    private readonly apiClient: ApiClient

    constructor(@inject(ApiClient) apiClient: ApiClient) {
        this.apiClient = apiClient
    }

    /**
     * Todo 목록 조회
     *
     * @param params - 페이징(page/size/sort) + 검색 조건
     * @returns Spring Page 형태의 목록
     */
    async getTodoList(params?: TodoListParams): Promise<TodoListResponse> {
        try {
            return await this.apiClient.get<TodoListResponse>(API_ENDPOINTS.TODOS.BASE, { params })
        } catch (error) {
            throw DefaultError.fromUnknown(error)
        }
    }

    /**
     * Todo 단건 조회
     *
     * @param idx - Todo IDX
     */
    async getTodoByIdx(idx: number): Promise<TodoResponseDto> {
        try {
            return await this.apiClient.get<TodoResponseDto>(API_ENDPOINTS.TODOS.DETAIL(idx))
        } catch (error) {
            throw DefaultError.fromUnknown(error)
        }
    }

    /**
     * Todo 등록
     *
     * @param dto - 등록할 Todo 정보 (`title` 필수)
     * @returns 생성된 Todo (201)
     */
    async insertTodo(dto: TodoInsertDto): Promise<TodoResponseDto> {
        try {
            return await this.apiClient.post<TodoResponseDto>(API_ENDPOINTS.TODOS.BASE, dto)
        } catch (error) {
            throw DefaultError.fromUnknown(error)
        }
    }

    /**
     * Todo 수정 — **부분 수정이다.** 보내지 않은 필드는 서버가 기존 값을 유지한다.
     *
     * ⚠️ 메서드는 PATCH 가 아니라 **PUT** 이다(서버 `TodoController.updateTodoByIdx`).
     *
     * @param idx - Todo IDX
     * @param dto - 수정할 필드만
     * @returns 수정된 Todo 전체
     */
    async updateTodoByIdx(idx: number, dto: TodoUpdateDto): Promise<TodoResponseDto> {
        try {
            return await this.apiClient.put<TodoResponseDto>(API_ENDPOINTS.TODOS.DETAIL(idx), dto)
        } catch (error) {
            throw DefaultError.fromUnknown(error)
        }
    }

    /**
     * Todo 삭제
     *
     * ⚠️ 응답이 **204 no content 가 아니라 200 + `{"result":"TRUE"}`** 다.
     *
     * @param idx - Todo IDX
     */
    async deleteTodoByIdx(idx: number): Promise<VoidResultType> {
        try {
            return await this.apiClient.delete<VoidResultType>(API_ENDPOINTS.TODOS.DETAIL(idx))
        } catch (error) {
            throw DefaultError.fromUnknown(error)
        }
    }
}
