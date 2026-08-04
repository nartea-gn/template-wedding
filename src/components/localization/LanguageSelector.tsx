import {useCallback, useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent} from 'react'
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
    const triggerRef = useRef<HTMLButtonElement>(null)
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
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

    const closeMenu = useCallback((restoreFocus = true) => {
        setIsOpen(false)
        if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus())
    }, [])

    useEffect(() => {
        if (!isOpen) return

        const selectedIndex = Math.max(0, supportedLocales.indexOf(locale))
        const focusFrame = requestAnimationFrame(() => optionRefs.current[selectedIndex]?.focus())
        const handlePointerDown = (event: PointerEvent) => {
            if (!selectorRef.current?.contains(event.target as Node)) closeMenu(false)
        }
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeMenu()
        }
        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            cancelAnimationFrame(focusFrame)
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, locale, supportedLocales, closeMenu])

    const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        const currentIndex = optionRefs.current.indexOf(document.activeElement as HTMLButtonElement)
        let nextIndex: number | undefined

        if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % supportedLocales.length
        if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + supportedLocales.length) % supportedLocales.length
        if (event.key === 'Home') nextIndex = 0
        if (event.key === 'End') nextIndex = supportedLocales.length - 1
        if (nextIndex === undefined) return

        event.preventDefault()
        optionRefs.current[nextIndex]?.focus()
    }

    if (!selectorVisible) return null
    const currentLocaleLabel = t(localeLabelKeys[locale] ?? 'language.label')

    return (
        <div ref={selectorRef} className="language-selector">
            <button
                ref={triggerRef}
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
                <div id={menuId} className="language-selector-menu" role="menu" aria-label={t('language.label')}
                     onKeyDown={handleMenuKeyDown}>
                    {supportedLocales.map((item, index) => {
                        const label = t(localeLabelKeys[item] ?? 'language.label')
                        const isSelected = item === locale
                        return (
                            <button
                                ref={element => {
                                    optionRefs.current[index] = element
                                }}
                                key={item}
                                type="button"
                                className={`language-selector-option ${isSelected ? 'language-selector-option--selected' : ''}`}
                                role="menuitemradio"
                                aria-checked={isSelected}
                                disabled={isLoading}
                                onClick={() => {
                                    closeMenu()
                                    if (!isSelected) void setLocale(item)
                                }}
                            >
                                <span
                                    className="language-selector-option-code">{localeCodes[item] ?? item.toUpperCase()}</span>
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
