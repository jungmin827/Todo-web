// reflect-metadata 를 엔트리 첫 import 로 둔다. 이 폴리필이 모듈 그래프에서 tsyringe 보다 먼저
// 평가돼야 한다. 실질 방어선은 core/di/container.ts 첫 줄의 같은 import 지만, 의도를 엔트리에서
// 읽히게 하려고 여기에도 둔다.
import 'reflect-metadata'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { queryClient } from './core/config/queryClient'
import { setupDIContainer } from './core/di/container'
import './index.css'

// 렌더 이전에 1회. 훅이 resolve 를 부르는 시점보다 반드시 앞서야 한다.
setupDIContainer()

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </StrictMode>,
)
