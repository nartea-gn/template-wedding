import {useLocalization} from '../../app/providers/useLocalization'
import type {WeddingMessageKey} from '../../invitations/wedding'
import './LanguageSelector.css'

const localeLabelKeys: Record<string, WeddingMessageKey> = {
    es: 'language.es',
    en: 'language.en',
    bg: 'language.bg',
}

export function LanguageSelector() {
    const {
        locale,
        supportedLocales,
        selectorVisible,
        isLoading,
        error,
        setLocale,
        t
    } = useLocalization<WeddingMessageKey>()
    if (!selectorVisible) return null

    return (
        <div className="language-selector">
            <label className="language-selector-label" htmlFor="invitation-language">{t('language.label')}</label>
            <select
                id="invitation-language"
                className="language-selector-select"
                value={locale}
                disabled={isLoading}
                onChange={event => void setLocale(event.target.value)}
            >
                {supportedLocales.map(item => (
                    <option key={item} value={item}>{t(localeLabelKeys[item] ?? 'language.label')}</option>
                ))}
            </select>
            <span className="language-selector-status" aria-live="polite">
                {isLoading ? t('language.loading') : error ? t('language.error') : ''}
            </span>
        </div>
    )
}
