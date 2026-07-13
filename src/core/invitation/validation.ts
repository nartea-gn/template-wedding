import type {InvitationDefinition} from './types'
import {validateFormDefinition} from '../forms'

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

    const pageSize = definition.capabilities.admin?.controls?.pagination?.pageSize
    if (pageSize !== undefined && (!Number.isInteger(pageSize) || pageSize < 1)) {
        errors.push('Admin pagination pageSize must be a positive integer')
    }

    const pageSizeSelector = definition.capabilities.admin?.controls?.pagination?.pageSizeSelector
    if (pageSizeSelector) {
        if (pageSizeSelector.enabled && definition.capabilities.admin?.controls?.pagination?.enabled !== true) {
            errors.push('Admin pagination pageSizeSelector requires pagination to be enabled')
        }
        const hasInvalidOption = pageSizeSelector.options.some(
            option => !Number.isInteger(option) || option < 1,
        )
        if (pageSizeSelector.options.length === 0 || hasInvalidOption) {
            errors.push('Admin pagination pageSizeSelector options must be positive integers')
        }
        if (new Set(pageSizeSelector.options).size !== pageSizeSelector.options.length) {
            errors.push('Admin pagination pageSizeSelector options must be unique')
        }
        if (pageSizeSelector.enabled && pageSize !== undefined && !pageSizeSelector.options.includes(pageSize)) {
            errors.push('Admin pagination pageSize must be included in pageSizeSelector options')
        }
    }

    if (hasEnabledRsvpCta && !hasEnabledRsvp) {
        errors.push('An enabled RSVP CTA requires the RSVP capability')
    }

    if (definition.capabilities.rsvp) errors.push(...validateFormDefinition(definition.capabilities.rsvp.form))

    return errors
}
