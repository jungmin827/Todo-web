import { container } from 'tsyringe'
import { ApiClient } from '../../network/apiClient'

// 네트워크 계층 등록.
export function setupNetworkModule(): void {
    container.registerSingleton(ApiClient)
}
