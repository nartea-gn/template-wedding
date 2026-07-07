import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App'
import {ThemeProvider} from './components/ThemeProvider'
import type {Theme} from './themes'
import {weddingConfig} from './config/wedding.config'

const theme = weddingConfig.theme as Theme

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found in index.html')
createRoot(rootElement).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <App/>
        </ThemeProvider>
    </StrictMode>,
)
