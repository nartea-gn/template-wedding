import type {ComponentType} from 'react'
import type {InvitationDefinition} from '../../core/invitation'
import {hasSectionRenderer} from './createSectionRegistry'
import type {SectionRegistry} from './types'
import {devError} from '../../lib/devLog'

type Props<Locale extends string, Message extends string> = {
    definition: InvitationDefinition<Locale, Message>
    registry: SectionRegistry<Message>
}

export function InvitationRenderer<Locale extends string, Message extends string>({
                                                                                      definition,
                                                                                      registry
                                                                                  }: Readonly<Props<Locale, Message>>) {
    return <>{definition.sections.filter(section => section.enabled).map(section => {
        if (!hasSectionRenderer(registry, section.type)) {
            devError(`Missing section renderer: ${section.type}`)
            return null
        }

        // SectionRegistry is a mapped type keyed by the section discriminant, so a cross-wired
        // entry already fails to compile. TypeScript still cannot correlate the lookup with this
        // particular section, so the cast asserts only what the mapped type guarantees: that the
        // component accepts *this* section, not any section.
        const Component = registry[section.type] as ComponentType<{
            section: typeof section
            event: typeof definition.event
            capabilities: typeof definition.capabilities
        }>
        return <Component
            key={section.id}
            section={section}
            event={definition.event}
            capabilities={definition.capabilities}
        />
    })}</>
}
