import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App'
import {ThemeProvider} from './components/ThemeProvider'
import {weddingInvitation} from './invitations/wedding'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found in index.html')
createRoot(rootElement).render(
    <StrictMode>
        <ThemeProvider theme={weddingInvitation.theme.id}>
            <App/>
        </ThemeProvider>
    </StrictMode>,
)
