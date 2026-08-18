import type { ListResultType } from '../../../core/types/commonTypes'

// Todo 도메인의 서버 계약. 서버 `timmy/todo/server/todo/dto/` 와 1:1로 맞춘다.
//
// ⚠️ 옛 `src/types/todo.ts` 와 필드가 다르다. 서버가 트루밸류 표준으로 정렬되면서
//    `id`→`idx`, `createdDate`→`registerDate`, `modifiedDate`→`modifyDate` 로 바뀌었고
//    `url` 은 없어졌다. 옛 타입은 5단계에서 지운다.

/**
 * Todo 응답 (서버 `TodoResponseDto`).
 *
 * ⚠️ `body` 가 optional 인 것은 서버 Jackson 설정이 `default-property-inclusion: non_null` 이라
 *    값이 없으면 키 자체가 응답에서 빠지기 때문이다. `body: string | null` 이 아니라 `body?: string` 이다.
 */
export interface TodoResponseDto {
    idx: number
    title: string
    body?: string
    completed: boolean
    /** 등록일. `LocalDateTime` 의 ISO 문자열 (예: `2026-08-18T18:36:15.123`) */
    registerDate: string
    /** 수정일 */
    modifyDate: string
}

/**
 * Todo 등록 (서버 `TodoInsertDto`).
 *
 * 서버 제약: `title` 은 `@NotBlank` + 최대 200자, `body` 는 최대 2000자.
 * `completed` 를 생략하면 서버가 false 로 둔다.
 */
export interface TodoInsertDto {
    title: string
    body?: string
    completed?: boolean
}

/**
 * Todo 수정 (서버 `TodoUpdateDto`).
 *
 * ⚠️ **부분 수정이다.** 서버 매퍼가 `NullValuePropertyMappingStrategy.IGNORE` 라 보내지 않은 필드는
 *    기존 값이 유지된다. 그래서 완료 토글은 `{ completed }` 하나만 보내면 되고,
 *    제목/내용을 지우려고 필드를 생략하면 지워지지 않는다는 뜻이기도 하다.
 */
export interface TodoUpdateDto {
    title?: string
    body?: string
    completed?: boolean
}

/**
 * 목록 조회 파라미터. Spring `Pageable` + `TodoQueryDto` 를 합친 것이다.
 *
 * ⚠️ interface 가 아니라 **type 별칭**이다. interface 는 암묵적 인덱스 시그니처를 얻지 못해
 *    `ApiClient` 의 `QueryParams`(Record) 에 그대로 넘길 수 없다.
 *
 * `sort` 는 `'idx,asc'` 처럼 `필드,방향` 문자열이며 배열로 여러 개를 줄 수 있다.
 * 직렬화(같은 키 반복)는 `ApiClient` 가 책임진다.
 */
export type TodoListParams = {
    /** 0-based. 생략 시 0 */
    page?: number
    /** 생략 시 서버 기본 20, 최대 2000 */
    size?: number
    sort?: readonly string[]

    // 검색 조건 (서버 `TodoQueryDto`)
    /** 제목 부분 일치 */
    title?: string
    /** 내용 부분 일치 */
    body?: string
    completed?: boolean
    /** ISO 문자열 (예: `2026-08-01T00:00:00`) */
    registerDateFrom?: string
    registerDateTo?: string
    modifyDateFrom?: string
    modifyDateTo?: string
}

/** 목록 응답 (Spring `Page<TodoResponseDto>`). */
export type TodoListResponse = ListResultType<TodoResponseDto>
