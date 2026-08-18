import { container } from 'tsyringe'
import { TodoRepository } from '../../../features/todos/repositories/todoRepository'

// Repository 등록. 이 목록이 "이 앱이 어떤 도메인에 의존하는가"의 정본이다.
//
// `@singleton()` 자가등록을 쓰지 않고 `@injectable()` + 여기서 명시 등록하는 이유:
// 자가등록은 그 모듈을 누군가 import 해야 일어나므로 등록 시점이 import 그래프에 딸려 다닌다.
// 등록을 눈에 보이는 한 곳에 모아 두면 그 순서 의존이 사라진다.
export function setupRepositoryModule(): void {
    container.registerSingleton(TodoRepository)
}
