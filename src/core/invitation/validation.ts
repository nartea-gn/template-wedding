import type {InvitationDefinition} from './types'

export function validateInvitationDefinition<Locale extends string, Message extends string>(
    definition: InvitationDefinition<Locale, Message>,
): string[] {
    const errors: string[] = []

    if (!definition.localization.supportedLocales.includes(definition.localization.defaultLocale)) {
        errors.push('defaultLocale must be included in supportedLocales')
    }

    if (definition.localization.selector.visible && definition.localization.supportedLocales.length < 2) {
        errors.push('A visible language selector requires at least two supported locales')
    }

    const sectionIds = definition.sections.map(section => section.id)
    if (new Set(sectionIds).size !== sectionIds.length) {
        errors.push('Section ids must be unique')
    }

    const hasEnabledRsvp = definition.capabilities.rsvp?.enabled === true
    const hasEnabledAdmin = definition.capabilities.admin?.enabled === true
    const hasEnabledRsvpCta = definition.sections.some(
        section => section.type === 'rsvp-cta' && section.enabled,
    )

    if (hasEnabledAdmin && !hasEnabledRsvp) {
        errors.push('Admin requires the RSVP capability to be enabled')
    }

    if (hasEnabledRsvpCta && !hasEnabledRsvp) {
        errors.push('An enabled RSVP CTA requires the RSVP capability')
    }

    return errors
}

