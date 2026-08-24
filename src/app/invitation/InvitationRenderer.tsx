import type {ComponentType} from 'react'
import type {InvitationDefinition, InvitationSection} from '../../core/invitation'
import {hasSectionRenderer} from './createSectionRegistry'
import type {SectionComponentProps, SectionRegistry} from './types'

type Props<Locale extends string, Message extends string> = {
    definition: InvitationDefinition<Locale, Message>
    registry: SectionRegistry<Message>
}

export function InvitationRenderer<Locale extends string, Message extends string>({
                                                                                      definition,
                                                                                      registry
                                                                                  }: Readonly<Props<Locale, Message>>) {
    return <main>{definition.sections.filter(section => section.enabled).map(section => {
        if (!hasSectionRenderer(registry, section.type)) {
            if (import.meta.env.DEV) console.error(`Missing section renderer: ${section.type}`)
            return null
        }

        // The registry is keyed by the same discriminant as the section union.
        const Component = registry[section.type] as ComponentType<SectionComponentProps<Message, InvitationSection<Message>['type']>>
        return <Component
            key={section.id}
            section={section}
            event={definition.event}
            capabilities={definition.capabilities}
        />
    })}</main>
}
