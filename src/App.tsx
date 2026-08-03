import AppRouter from './routes/AppRouter';
import {LanguageSelector} from './components/localization/LanguageSelector'
import {SeoMetadata} from './components/SeoMetadata'
import {weddingInvitation, type WeddingMessageKey} from './invitations/wedding'

export default function App() {
    return (
        <>
            <SeoMetadata<WeddingMessageKey> definition={weddingInvitation.seo}/>
            <LanguageSelector/>
            <AppRouter/>
        </>
    );
}
