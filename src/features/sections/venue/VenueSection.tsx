import type {SectionComponentProps} from '../../../app/invitation'
import {useLocalization} from '../../../app/providers/useLocalization'
import {MapProviderPicker} from './MapProviderPicker'
import type {MapProviderId} from './MapProviderIcon'

type MapProvider<Message extends string> = { id: MapProviderId; label: Message; badge?: Message }

function isAppleMobileDevice() {
    const isIos = /iPad|iPhone|iPod/i.test(navigator.userAgent)
    const isIpados = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
    return isIos || isIpados
}

function createMapUrl(provider: MapProviderId, query: string) {
    const encodedQuery = encodeURIComponent(query)
    const appleMapsUrl = `https://maps.apple.com/?q=${encodedQuery}`
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`

    if (provider === 'apple') return appleMapsUrl
    if (provider === 'google') return googleMapsUrl
    if (isAppleMobileDevice()) return appleMapsUrl
    if (/Android/i.test(navigator.userAgent)) return `geo:0,0?q=${encodedQuery}`
    return googleMapsUrl
}

export function VenueSection<Message extends string>({section}: Readonly<SectionComponentProps<Message, 'venue'>>) {
    const {t} = useLocalization<Message>()
    const defaultProviders: readonly MapProvider<Message>[] = [
        {id: 'device', label: 'venue.map.device' as Message, badge: 'venue.map.recommended' as Message},
        {id: 'google', label: 'venue.map.google' as Message},
        {id: 'apple', label: 'venue.map.apple' as Message},
    ]
    const providers = section.content.mapProviders ?? defaultProviders

    return (
        <section className="landing-venue">
            <p className="landing-venue-label">{t(section.content.label)}</p>
            <div className="landing-venue-grid">
                {section.content.items.map(item => {
                    const mapsQuery = item.mapsQuery
                    return <div key={item.id} className="landing-venue-card card">
                        <p className="landing-venue-type">{t(item.typeLabel)}</p>
                        <p className="landing-venue-name">{t(item.name)}</p>
                        {item.time && <p className="landing-venue-time">{item.time}</p>}
                        {item.address && <p className="landing-venue-address">{t(item.address)}</p>}
                        {mapsQuery && (
                            <MapProviderPicker
                                triggerLabel={t(section.content.mapLabel)}
                                pickerLabel={t(section.content.mapPickerLabel)}
                                closeLabel={t(section.content.mapPickerCloseLabel)}
                                options={providers.map(provider => ({
                                    id: provider.id,
                                    label: t(provider.label),
                                    badge: provider.badge ? t(provider.badge) : undefined,
                                    url: createMapUrl(provider.id, mapsQuery),
                                }))}
                            />
                        )}
                    </div>
                })}
            </div>
        </section>
    )
}
