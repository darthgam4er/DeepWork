import React from 'react'
import ReactDOM from 'react-dom/client'
import { MiniTimer } from '@/components/MiniTimer'

ReactDOM.createRoot(document.getElementById('mini-root')!).render(
    <React.StrictMode>
        <MiniTimer />
    </React.StrictMode>,
)
