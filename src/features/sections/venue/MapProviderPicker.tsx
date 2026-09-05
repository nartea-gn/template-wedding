import {useCallback, useEffect, useId, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import type {MapProviderId} from './MapProviderIcon'
import {MapProviderIcon} from './MapProviderIcon'

type MapProviderOption = {
    id: MapProviderId
    label: string
    badge?: string
    url: string
}

type MapProviderPickerProps = {
    triggerLabel: string
    pickerLabel: string
    closeLabel: string
    options: readonly MapProviderOption[]
}

const desktopMediaQuery = '(min-width: 1024px)'

function useDesktopViewport() {
    const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(desktopMediaQuery).matches)

    useEffect(() => {
        const mediaQuery = window.matchMedia(desktopMediaQuery)
        const updateViewport = () => setIsDesktop(mediaQuery.matches)
        mediaQuery.addEventListener('change', updateViewport)
        return () => mediaQuery.removeEventListener('change', updateViewport)
    }, [])

    return isDesktop
}

export function MapProviderPicker({
                                      triggerLabel,
                                      pickerLabel,
                                      closeLabel,
                                      options,
                                  }: Readonly<MapProviderPickerProps>) {
    const [isOpen, setIsOpen] = useState(false)
    const isDesktop = useDesktopViewport()
    const pickerId = useId()
    const wrapperRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    const closePicker = useCallback((restoreFocus = true) => {
        setIsOpen(false)
        if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus())
    }, [])

    useEffect(() => {
        if (!isOpen) return

        const focusFrame = requestAnimationFrame(() => {
            panelRef.current?.querySelector<HTMLAnchorElement>('a')?.focus()
        })
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closePicker()
                return
            }
            if (event.key !== 'Tab') return
            if (isDesktop) {
                // Non-modal popover on desktop: trapping Tab here would be the bug. Close and
                // let focus continue, matching the language selector.
                closePicker(false)
                return
            }
            if (!panelRef.current) return

            const focusableElements = panelRef.current.querySelectorAll<HTMLElement>('a, button')
            const firstElement = focusableElements.item(0)
            const lastElement = focusableElements.item(focusableElements.length - 1)
            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault()
                lastElement?.focus()
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault()
                firstElement?.focus()
            }
        }

        document.addEventListener('keydown', closeOnEscape)
        return () => {
            cancelAnimationFrame(focusFrame)
            document.removeEventListener('keydown', closeOnEscape)
        }
    }, [isOpen, isDesktop, closePicker])

    useEffect(() => {
        if (!isOpen || !isDesktop) return

        const closeOnOutsidePress = (event: PointerEvent) => {
            if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) {
                closePicker(false)
            }
        }

        document.addEventListener('pointerdown', closeOnOutsidePress)
        return () => document.removeEventListener('pointerdown', closeOnOutsidePress)
    }, [isOpen, isDesktop, closePicker])

    useEffect(() => {
        if (!isOpen || isDesktop) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [isOpen, isDesktop])

    const panel = (
        <div
            ref={panelRef}
            id={pickerId}
            className={isDesktop ? 'landing-map-picker-panel landing-map-picker-popover card' : 'landing-map-picker-panel landing-map-picker-sheet'}
            role="dialog"
            aria-modal={isDesktop ? undefined : true}
            aria-labelledby={`${pickerId}-title`}
        >
            {!isDesktop && <span className="landing-map-picker-handle" aria-hidden="true"/>}
            <div className="landing-map-picker-header">
                <p id={`${pickerId}-title`} className="landing-map-picker-title">{pickerLabel}</p>
                <button type="button" className="landing-map-picker-close" aria-label={closeLabel}
                        onClick={() => closePicker()}>
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="m5 5 10 10M15 5 5 15"/>
                    </svg>
                </button>
            </div>
            <div className="landing-map-picker-options">
                {options.map(option => (
                    <a
                        key={option.id}
                        href={option.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="landing-map-picker-option"
                        onClick={() => closePicker()}
                    >
                        <span className={`landing-map-picker-mark landing-map-picker-mark--${option.id}`}>
                            <MapProviderIcon provider={option.id}/>
                        </span>
                        <span className="landing-map-picker-option-content">
                            <span>{option.label}</span>
                            {option.badge && (
                                <span className="landing-map-picker-badge">{option.badge}</span>
                            )}
                        </span>
                        <svg className="landing-map-picker-arrow" viewBox="0 0 20 20" aria-hidden="true">
                            <path d="M7.5 5h7.5v7.5M15 5l-9.5 9.5"/>
                        </svg>
                    </a>
                ))}
            </div>
        </div>
    )

    return (
        <div ref={wrapperRef} className="landing-venue-map-shell">
            <button
                ref={triggerRef}
                type="button"
                className="landing-venue-map-trigger btn btn--outline"
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                aria-controls={pickerId}
                onClick={() => setIsOpen(current => !current)}
            >
                <svg className="landing-venue-map-trigger-icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/>
                    <circle cx="12" cy="10" r="2.25"/>
                </svg>
                {triggerLabel}
            </button>
            {isOpen && isDesktop && panel}
            {isOpen && !isDesktop && createPortal(
                <div className="landing-map-picker-layer">
                    <div className="landing-map-picker-backdrop" aria-hidden="true"
                         onClick={() => closePicker()}/>
                    {panel}
                </div>,
                document.body,
            )}
        </div>
    )
}
