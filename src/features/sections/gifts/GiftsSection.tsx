import {useState} from 'react'
import type {SectionComponentProps} from '../../../app/invitation'
import {useLocalization} from '../../../app/providers/useLocalization'
import './GiftsSection.css'
import {devWarn} from '../../../lib/devLog'

const HEADING_ID = 'landing-gifts-heading'

type CopyableProps = {
    label: string
    value: string
    copyLabel: string
    copiedLabel: string
}

/** One account detail with a copy button, so nobody retypes an IBAN by hand. */
function CopyableDetail({label, value, copyLabel, copiedLabel}: Readonly<CopyableProps>) {
    const [copied, setCopied] = useState(false)

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (cause) {
            // Clipboard access can be denied; the value stays selectable on screen.
            devWarn('Could not copy the account detail', cause)
        }
    }

    return (
        <p className="landing-gifts-detail">
            <span className="landing-gifts-detail-label">{label}</span>
            <span className="landing-gifts-detail-value">{value}</span>
            <button type="button" className="btn btn--ghost landing-gifts-copy"
                    onClick={() => void copy()}
                    aria-label={`${copyLabel} ${label}`}>
                {copied ? copiedLabel : copyLabel}
            </button>
        </p>
    )
}

/**
 * Gift registry and bank details.
 *
 * Account details stay out of the initial HTML until a guest asks for them: publishing an IBAN
 * and a personal phone number openly makes impersonation cheap ("the couple's number changed").
 * The warning line next to them cuts the most common version of that fraud.
 */
export function GiftsSection<Message extends string>({
                                                         section,
                                                     }: Readonly<SectionComponentProps<Message, 'gifts'>>) {
    const {t} = useLocalization<Message>()
    const {registry, account} = section.content
    const [revealed, setRevealed] = useState(() => account?.revealOnRequest === false)

    return (
        <section className="landing-gifts" aria-labelledby={HEADING_ID}>
            <h2 id={HEADING_ID} className="landing-gifts-label">{t(section.content.label)}</h2>
            {section.content.noteKey && <p className="landing-gifts-note">{t(section.content.noteKey)}</p>}

            {registry && (
                <a href={registry.url} target="_blank" rel="noopener noreferrer"
                   className="landing-gifts-registry btn btn--outline"
                   aria-label={`${t(registry.labelKey)} (${t(section.content.newTabLabel)})`}>
                    {t(registry.labelKey)}
                </a>
            )}

            {account && (
                <div className="landing-gifts-account">
                    <p className="landing-gifts-holder">{t(account.holderKey)}</p>
                    {revealed ? (
                        <>
                            <CopyableDetail label={t(account.ibanLabel)} value={account.iban}
                                            copyLabel={t(account.copyLabel)} copiedLabel={t(account.copiedLabel)}/>
                            {account.bizum && (
                                <CopyableDetail label={t(account.bizumLabel)} value={account.bizum}
                                                copyLabel={t(account.copyLabel)} copiedLabel={t(account.copiedLabel)}/>
                            )}
                        </>
                    ) : (
                        <button type="button" className="btn btn--outline landing-gifts-reveal"
                                onClick={() => setRevealed(true)}>
                            {t(account.revealLabel)}
                        </button>
                    )}
                    <p className="landing-gifts-warning" role="note">{t(section.content.fraudWarningKey)}</p>
                </div>
            )}
        </section>
    )
}
