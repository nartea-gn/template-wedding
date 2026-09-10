import {useState} from 'react'
import type {SectionComponentProps} from '../../../app/invitation'
import {useLocalization} from '../../../app/providers/useLocalization'
import './GiftsSection.css'
import {devWarn} from '../../../lib/devLog'

const HEADING_ID = 'landing-gifts-heading'
const BIZUM_HEADING_ID = 'landing-gifts-bizum-heading'

type CopyableProps = {
    label: string
    value: string
    copyLabel: string
    copiedLabel: string
    /**
     * Prepended to the button's accessible name. A Bizum row is labelled with a person, so on its
     * own the button would announce "Copy Gala" and lose what is being copied.
     */
    groupLabel?: string
}

/** One account detail with a copy button, so nobody retypes an IBAN by hand. */
function CopyableDetail({label, value, copyLabel, copiedLabel, groupLabel}: Readonly<CopyableProps>) {
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
                    aria-label={[copyLabel, groupLabel, label].filter(Boolean).join(' ')}>
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
 * The warning line belongs to the Bizum numbers rather than to the account block, because the
 * phone is what that fraud impersonates: an invitation that publishes only an IBAN has nothing
 * to warn about, and one that switches Bizum off drops the numbers and the warning together.
 */
export function GiftsSection<Message extends string>({
                                                         section,
                                                     }: Readonly<SectionComponentProps<Message, 'gifts'>>) {
    const {t} = useLocalization<Message>()
    const {registry, account} = section.content
    const [revealed, setRevealed] = useState(() => account?.revealOnRequest === false)
    const bizum = account?.bizum?.enabled === true && account.bizum.numbers.length > 0
        ? account.bizum
        : undefined

    return (
        <section className="landing-gifts" aria-labelledby={HEADING_ID}>
            <h2 id={HEADING_ID} className="landing-section-title landing-gifts-label">{t(section.content.label)}</h2>
            {section.content.noteKey && <p className="landing-gifts-note">{t(section.content.noteKey)}</p>}

            {registry && (
                <a href={registry.url} target="_blank" rel="noopener noreferrer"
                   className="btn btn--outline"
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
                            {bizum && (
                                <div className="landing-gifts-bizum" role="group"
                                     aria-labelledby={BIZUM_HEADING_ID}>
                                    <p id={BIZUM_HEADING_ID} className="landing-gifts-bizum-heading">
                                        {t(bizum.labelKey)}
                                    </p>
                                    {bizum.numbers.map(number => (
                                        <CopyableDetail key={number.labelKey} label={t(number.labelKey)}
                                                        value={number.value}
                                                        copyLabel={t(account.copyLabel)}
                                                        copiedLabel={t(account.copiedLabel)}
                                                        groupLabel={t(bizum.labelKey)}/>
                                    ))}
                                    <p className="landing-gifts-warning" role="note">
                                        {t(section.content.fraudWarningKey)}
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <button type="button" className="btn btn--outline"
                                onClick={() => setRevealed(true)}>
                            {t(account.revealLabel)}
                        </button>
                    )}
                </div>
            )}
        </section>
    )
}
