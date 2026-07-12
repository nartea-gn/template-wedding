import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App'
import {ThemeProvider} from './components/ThemeProvider'
import {esMessages, weddingCatalogLoaders, weddingInvitation} from './invitations/wedding'
import {LocalizationProvider} from './app/providers/LocalizationProvider'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found in index.html')
createRoot(rootElement).render(
    <StrictMode>
        <LocalizationProvider
            invitationId={weddingInvitation.id}
            definition={weddingInvitation.localization}
            defaultCatalog={esMessages}
            loaders={weddingCatalogLoaders}
            timeZone={weddingInvitation.event.timezone}
        >
            <ThemeProvider theme={weddingInvitation.theme.id}>
                <App/>
            </ThemeProvider>
        </LocalizationProvider>
    </StrictMode>,
)
