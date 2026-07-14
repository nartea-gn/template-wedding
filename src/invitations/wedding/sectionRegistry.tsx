import {createSectionRegistry} from '../../app/invitation'
import {HeroSection} from '../../features/sections/hero/HeroSection'
import {CountdownSection} from '../../features/sections/countdown/CountdownSection'
import {VideoSection} from '../../features/sections/video/VideoSection'
import {VenueSection} from '../../features/sections/venue/VenueSection'
import {RsvpCtaSection} from '../../features/sections/rsvp/RsvpCtaSection'
import type {WeddingMessageKey} from './locales/es'
import {resolveWeddingAsset} from './assets'

export const weddingSectionRegistry = createSectionRegistry<WeddingMessageKey>({
    hero: HeroSection,
    countdown: CountdownSection,
    video: props => <VideoSection {...props} src={resolveWeddingAsset(props.section.content.assetId)}
                                  poster={props.section.content.posterAssetId
                                      ? resolveWeddingAsset(props.section.content.posterAssetId)
                                      : undefined}/>,
    venue: VenueSection,
    'rsvp-cta': RsvpCtaSection,
})
