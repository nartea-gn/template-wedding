import AppRouter from './routes/AppRouter';
import {LanguageSelector} from './components/localization/LanguageSelector'

export default function App() {
    return (
        <>
            <LanguageSelector/>
            <AppRouter/>
        </>
    );
}
