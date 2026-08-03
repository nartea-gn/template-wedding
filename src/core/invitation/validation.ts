import type {InvitationDefinition} from './types'
import {validateFormDefinition} from '../forms'
import {isValidTimeZone, parseInstant} from './temporal'

const STABLE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function hasBlankValue(values: readonly string[]): boolean {
    return values.some(value => value.trim().length === 0)
}

export function validateInvitationDefinition<Locale extends string, Message extends string>(
    definition: InvitationDefinition<Locale, Message>,
): string[] {
    const errors: string[] = []

    if (!STABLE_ID_PATTERN.test(definition.id)) {
        errors.push('Invitation id must use lowercase kebab-case')
    }

    if (!STABLE_ID_PATTERN.test(definition.event.type)) {
        errors.push('Event type must use lowercase kebab-case')
    }

    if (!STABLE_ID_PATTERN.test(definition.theme.id)) {
        errors.push('Theme id must use lowercase kebab-case')
    }

    if (hasBlankValue([definition.event.title, definition.seo.title, definition.seo.description])) {
        errors.push('Event title and SEO message keys must not be empty')
    }

    const eventTimestamp = parseInstant(definition.event.date)
    if (eventTimestamp === null) {
        errors.push('Event date must be an ISO 8601 instant with an explicit offset')
    }

    if (!isValidTimeZone(definition.event.timezone)) {
        errors.push('Event timezone must be a valid IANA timezone')
    }

    if (!definition.localization.supportedLocales.includes(definition.localization.defaultLocale)) {
        errors.push('defaultLocale must be included in supportedLocales')
    }

    if (definition.localization.selector.visible && definition.localization.supportedLocales.length < 2) {
        errors.push('A visible language selector requires at least two supported locales')
    }

    const sectionIds = definition.sections.map(section => section.id)
    if (definition.sections.every(section => !section.enabled)) {
        errors.push('An invitation requires at least one enabled section')
    }
    if (sectionIds.some(id => !STABLE_ID_PATTERN.test(id))) {
        errors.push('Section ids must use lowercase kebab-case')
    }
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

    const deadline = definition.capabilities.rsvp?.deadline
    const deadlineTimestamp = deadline ? parseInstant(deadline) : null
    if (definition.capabilities.rsvp && deadlineTimestamp === null) {
        errors.push('RSVP deadline must be an ISO 8601 instant with an explicit offset')
    }
    if (deadlineTimestamp !== null && eventTimestamp !== null && deadlineTimestamp >= eventTimestamp) {
        errors.push('RSVP deadline must be before the event date')
    }

    for (const section of definition.sections) {
        if (!section.enabled) continue
        if (section.type === 'hero' && hasBlankValue([
            section.content.partnerOne,
            section.content.partnerTwo,
            section.content.subtitle,
        ])) {
            errors.push(`Hero section ${section.id} requires complete message keys`)
        }
        if (section.type === 'countdown' && hasBlankValue([
            section.content.label,
            ...Object.values(section.content.unitLabels),
        ])) {
            errors.push(`Countdown section ${section.id} requires complete message keys`)
        }
        if (section.type === 'video' && hasBlankValue([
            section.content.assetId,
            section.content.label,
            section.content.playLabel,
            section.content.loadingLabel,
            section.content.errorLabel,
        ])) {
            errors.push(`Video section ${section.id} requires an asset and complete message keys`)
        }
        if (section.type === 'rsvp-cta' && hasBlankValue([
            section.content.label,
            section.content.closedLabel,
        ])) {
            errors.push(`RSVP CTA section ${section.id} requires open and closed labels`)
        }
        if (section.type !== 'venue') continue
        const itemIds = section.content.items.map(item => item.id)
        if (section.enabled && itemIds.length === 0) errors.push(`Venue section ${section.id} requires an item`)
        if (itemIds.some(id => !STABLE_ID_PATTERN.test(id))) {
            errors.push(`Venue section ${section.id} item ids must use lowercase kebab-case`)
        }
        if (new Set(itemIds).size !== itemIds.length) {
            errors.push(`Venue section ${section.id} item ids must be unique`)
        }
        if (section.content.items.some(item => hasBlankValue([item.typeLabel, item.name]))) {
            errors.push(`Venue section ${section.id} items require type and name message keys`)
        }
        if (section.content.items.some(item => item.mapsQuery !== undefined && item.mapsQuery.trim().length === 0)) {
            errors.push(`Venue section ${section.id} mapsQuery must not be empty when provided`)
        }
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
