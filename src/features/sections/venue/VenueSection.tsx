import type {SectionComponentProps} from '../../../app/invitation'
import {useLocalization} from '../../../app/providers/useLocalization'
import {MapProviderPicker} from './MapProviderPicker'

type MapProviderId = 'device' | 'google' | 'apple'
type MapProvider<Message extends string> = { id: MapProviderId; label: Message }

function createMapUrl(provider: MapProviderId, query: string) {
    const encodedQuery = encodeURIComponent(query)
    if (provider === 'device') return `geo:0,0?q=${encodedQuery}`
    if (provider === 'apple') return `https://maps.apple.com/?q=${encodedQuery}`
    return `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`
}

export function VenueSection<Message extends string>({section}: Readonly<SectionComponentProps<Message, 'venue'>>) {
    const {t} = useLocalization<Message>()
    const defaultProviders = [
        {id: 'device', label: 'venue.map.device' as Message},
        {id: 'google', label: 'venue.map.google' as Message},
        {id: 'apple', label: 'venue.map.apple' as Message},
    ] satisfies readonly MapProvider<Message>[]
    const providers = section.content.mapProviders ?? defaultProviders

    return (
        <section className="landing-venue">
            <p className="landing-venue-label">{t(section.content.label)}</p>
            <div className="landing-venue-grid">
                {section.content.items.map(item => (
                    <div key={item.id} className="landing-venue-card card">
                        <p className="landing-venue-type">{t(item.typeLabel)}</p>
                        <p className="landing-venue-name">{t(item.name)}</p>
                        {item.time && <p className="landing-venue-time">{item.time}</p>}
                        {item.address && <p className="landing-venue-address">{t(item.address)}</p>}
                        {item.mapsQuery && (
                            <MapProviderPicker
                                triggerLabel={t(section.content.mapLabel)}
                                pickerLabel={t(section.content.mapPickerLabel)}
                                closeLabel={t(section.content.mapPickerCloseLabel)}
                                options={providers.map(provider => ({
                                    id: provider.id,
                                    label: t(provider.label),
                                    url: createMapUrl(provider.id, item.mapsQuery),
                                }))}
                            />
                        )}
                    </div>
                ))}
            </div>
        </section>
    )
}
