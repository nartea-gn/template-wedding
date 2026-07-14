import type {ReactNode} from 'react'

type Props = {
    name: string
    className?: string
}

const paths: Record<string, ReactNode> = {
    check: <path d="m5 12 4 4L19 6"/>,
    close: <><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>,
    'alert-triangle': <><path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4M12 17h.01"/></>,
    clipboard: <><path d="M9 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M8 12h8M8 16h6"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
    'heart-broken': <><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3C14.7 3 13.2 3.8 12 5.1A5.9 5.9 0 0 0 7.5 3 5.5 5.5 0 0 0 2 8.5C2 10.8 3.5 12.5 5 14l7 7 7-7Z"/><path d="m12 5.1-2 4 4 2-2 4 2 3.9"/></>,
    inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/></>,
    bus: <><rect x="5" y="3" width="14" height="16" rx="2"/><path d="M5 11h14M8 7h2M14 7h2M7 19v2M17 19v2"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></>,
    sparkles: <><path d="m12 3 1.1 3.4L16.5 7.5l-3.4 1.1L12 12l-1.1-3.4-3.4-1.1 3.4-1.1L12 3Z"/><path d="m18 13 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8L18 13ZM5 14l.7 1.8L7.5 16.5l-1.8.7L5 19l-.7-1.8-1.8-.7 1.8-.7L5 14Z"/></>,
    refresh: <><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 4v6h-6"/></>,
    play: <path d="m9 7 8 5-8 5V7Z"/>,
    ornament: <><path d="M12 4v16M4 12h16"/><path d="m7 7 10 10M17 7 7 17"/></>,
    rings: <><circle cx="9.5" cy="14" r="5.25"/><circle cx="14.5" cy="14" r="5.25"/><path d="M7.8 8.3h3.4M12.8 8.3h3.4"/><path d="m9.5 6.6 1.7 1.7M14.5 6.6l1.7 1.7"/></>,
}

export function InterfaceIcon({name, className}: Readonly<Props>) {
    const content = paths[name]
    if (!content) return null
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            {content}
        </svg>
    )
}
