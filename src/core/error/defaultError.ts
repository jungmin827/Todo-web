// 앱 전역 에러 타입. 어느 계층에서 무엇이 터지든 이 타입 하나로 정규화해서 올린다.
//
// tsconfig 의 `erasableSyntaxOnly` 때문에 enum 을 쓸 수 없다(TS1294). as const 객체 + union 으로 낸다 —
// 값과 타입을 같은 이름으로 둘 수 있어 사용감은 enum 과 같다.
export const ErrorCode = {
    /** 요청이 서버에 닿지 못함 (fetch 자체가 실패) */
    NETWORK_ERROR: 'NETWORK_ERROR',
    /** 서버가 응답했으나 2xx 가 아님 */
    HTTP_ERROR: 'HTTP_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

interface DefaultErrorOptions {
    statusCode?: number
    cause?: unknown
}

export class DefaultError extends Error {
    readonly code: ErrorCode
    readonly statusCode?: number

    constructor(code: ErrorCode, message: string, options?: DefaultErrorOptions) {
        super(message, { cause: options?.cause })
        this.name = 'DefaultError'
        this.code = code
        this.statusCode = options?.statusCode
    }

    /**
     * 2xx 가 아닌 응답 → DefaultError.
     *
     * ⚠️ 메시지를 `${status} ${statusText}` 로 두는 것은 **의도적으로 기존 동작을 유지**하는 것이다.
     * 서버는 본문에 한국어 message 를 실어 주지만(`ExceptionResponseDTO`), 그걸 쓰면 화면에 보이는
     * 문구가 바뀐다. 리팩터링 중에는 바꾸지 않는다. 나중에 쓰려면 이 메서드 한 곳만 고치면 된다.
     */
    static fromResponse(response: Response): DefaultError {
        return new DefaultError(ErrorCode.HTTP_ERROR, `${response.status} ${response.statusText}`, {
            statusCode: response.status,
        })
    }

    /**
     * 정체 모를 값 → DefaultError. 이미 DefaultError 면 그대로 통과시킨다.
     *
     * 메시지는 원본을 그대로 쓴다. 여기서 문구를 만들어 덮으면 위와 같은 이유로 동작이 바뀐다.
     */
    static fromUnknown(error: unknown): DefaultError {
        if (error instanceof DefaultError) return error

        // fetch 는 네트워크 실패를 TypeError 로 던진다 ('Failed to fetch').
        if (error instanceof TypeError) {
            return new DefaultError(ErrorCode.NETWORK_ERROR, error.message, { cause: error })
        }
        if (error instanceof Error) {
            return new DefaultError(ErrorCode.UNKNOWN_ERROR, error.message, { cause: error })
        }
        return new DefaultError(ErrorCode.UNKNOWN_ERROR, String(error), { cause: error })
    }
}
