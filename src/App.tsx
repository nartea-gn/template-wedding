import AppRouter from './routes/AppRouter';
import {LanguageSelector} from './components/localization/LanguageSelector'
import {SeoMetadata} from './components/SeoMetadata'
import {weddingInvitation, type WeddingMessageKey} from './invitations/wedding'
import {useLocalization} from './app/providers/useLocalization'

export default function App() {
    const {t} = useLocalization<WeddingMessageKey>()
    return (
        <>
            <SeoMetadata<WeddingMessageKey> definition={weddingInvitation.seo}/>
            {/* Estaba en espanol fijo, asi que bajo `lang="bg"` el primer elemento enfocable de la
                pagina -- el que existe para quien navega con teclado o lector de pantalla -- le
                hablaba en un idioma que no habia elegido. */}
            <a href="#main-content" className="skip-link">{t('a11y.skipToContent')}</a>
            <header><LanguageSelector/></header>
            <AppRouter/>
        </>
    );
}
