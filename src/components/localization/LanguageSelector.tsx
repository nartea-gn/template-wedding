import {useEffect, useId, useRef, useState} from 'react'
import {useLocalization} from '../../app/providers/useLocalization'
import type {WeddingMessageKey} from '../../invitations/wedding'
import './LanguageSelector.css'

const localeLabelKeys: Record<string, WeddingMessageKey> = {
    es: 'language.es',
    en: 'language.en',
    bg: 'language.bg',
}

const localeCodes: Record<string, string> = {
    es: 'ES',
    en: 'EN',
    bg: 'BG',
}

export function LanguageSelector() {
    const menuId = useId()
    const selectorRef = useRef<HTMLDivElement>(null)
    const [isOpen, setIsOpen] = useState(false)
    const {
        locale,
        supportedLocales,
        selectorVisible,
        isLoading,
        error,
        setLocale,
        t
    } = useLocalization<WeddingMessageKey>()

    useEffect(() => {
        if (!isOpen) return
        const handlePointerDown = (event: PointerEvent) => {
            if (!selectorRef.current?.contains(event.target as Node)) setIsOpen(false)
        }
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false)
        }
        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen])

    if (!selectorVisible) return null
    const currentLocaleLabel = t(localeLabelKeys[locale] ?? 'language.label')

    return (
        <div ref={selectorRef} className="language-selector">
            <button
                type="button"
                className="language-selector-trigger"
                disabled={isLoading}
                title={currentLocaleLabel}
                aria-label={`${t('language.label')}: ${currentLocaleLabel}`}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-controls={menuId}
                onClick={() => setIsOpen(open => !open)}
            >
                <span>{localeCodes[locale] ?? locale.toUpperCase()}</span>
                <span className="language-selector-chevron" aria-hidden="true"/>
            </button>
            {isOpen && (
                <div id={menuId} className="language-selector-menu" role="menu" aria-label={t('language.label')}>
                    {supportedLocales.map(item => {
                        const label = t(localeLabelKeys[item] ?? 'language.label')
                        const isSelected = item === locale
                        return (
                            <button
                                key={item}
                                type="button"
                                className={`language-selector-option ${isSelected ? 'language-selector-option--selected' : ''}`}
                                role="menuitemradio"
                                aria-checked={isSelected}
                                disabled={isLoading}
                                onClick={() => {
                                    setIsOpen(false)
                                    if (!isSelected) void setLocale(item)
                                }}
                            >
                                <span className="language-selector-option-code">{localeCodes[item] ?? item.toUpperCase()}</span>
                                <span>{label}</span>
                            </button>
                        )
                    })}
                </div>
            )}
            <span className="language-selector-status" aria-live="polite">
                {isLoading ? t('language.loading') : error ? t('language.error') : ''}
            </span>
        </div>
    )
}
