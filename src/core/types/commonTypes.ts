// 도메인과 무관한 서버 공통 응답 봉투. feature 는 이걸 alias 해서 쓴다.

/**
 * 목록 응답. 서버가 `Page<T>` 를 `PageSerializationMode.VIA_DTO` 로 직렬화한 형태다.
 *
 * ⚠️ `PageImpl` 의 전체 게터(`totalElements`, `first`, `numberOfElements`, `pageable` …)가
 * 최상위에 펼쳐지는 형태가 **아니다**. 페이지 메타는 `page` 안에 4개만 들어 있다
 * (서버 `config/WebConfig.java`).
 */
export interface ListResultType<T> {
    content: T[]
    page: {
        /** 페이지 크기 */
        size: number
        /** 현재 페이지 번호 (0-based) */
        number: number
        /** 전체 건수 */
        totalElements: number
        /** 전체 페이지 수 */
        totalPages: number
    }
}

/** 서버 `ResponseDataType` enum. */
export type ResponseDataType = 'TRUE' | 'FALSE' | 'SUCCESS' | 'SEND_CODE'

/**
 * 본문 없는 결과의 표준 래퍼(서버 `ResponseData<Void>`).
 *
 * ⚠️ 이 서버의 DELETE 는 **204 no content 가 아니라 200 + `{"result":"TRUE"}`** 다.
 * `data` 는 null 이라 Jackson 의 `non_null` 설정에 걸려 응답에서 아예 빠진다.
 */
export interface VoidResultType {
    result: ResponseDataType
}
