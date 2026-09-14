// @vitest-environment node
import {describe, expect, it} from 'vitest'
import {weddingInvitation} from '../../invitations/wedding'
import {validateInvitationDefinition} from './validation'

type WeddingSection = (typeof weddingInvitation)['sections'][number]

describe('validateInvitationDefinition', () => {
    it('accepts the canonical wedding invitation', () => {
        expect(validateInvitationDefinition(weddingInvitation)).toEqual([])
    })

    it.each([
        ['a blank name', {name: '   ', email: 'hola@ejemplo.com'}],
        ['no contact address', {name: 'controller.name', email: ''}],
    ])('rejects a data controller with %s', (_case, controller) => {
        const definition = {...weddingInvitation, controller}

        expect(validateInvitationDefinition(definition)).toContain(
            'The data controller requires a name message key and a contact email',
        )
    })

    it('rejects a declared hashtag that names no message key', () => {
        const definition = {...weddingInvitation, event: {...weddingInvitation.event, hashtag: '  '}}

        expect(validateInvitationDefinition(definition)).toContain(
            'Event hashtag must name a message key when declared',
        )
    })

    it('accepts an invitation that declares no hashtag', () => {
        const event = {...weddingInvitation.event} as Record<string, unknown>
        delete event.hashtag
        const definition = {...weddingInvitation, event} as typeof weddingInvitation

        expect(validateInvitationDefinition(definition)).toEqual([])
    })

    // Un id mal escrito en `columns` o en `metrics` no rompia nada: daba una columna en blanco, un
    // reparto vacio y un filtro que no casa con nadie, los tres indistinguibles de "todavia no hay
    // respuestas". Dentro del formulario esto ya fallaba; fuera, no.
    it.each([
        ['columns', {columns: ['fullName', 'menuChoise']}, 'Admin column references unknown field menuChoise'],
        ['columnLabels', {columnLabels: {menuChoise: 'admin.menu'}}, 'Admin column label references unknown field menuChoise'],
        ['breakdownLabels', {breakdownLabels: {menuChoise: 'admin.menus'}}, 'Admin breakdown label references unknown field menuChoise'],
        ['csvExport columns', {controls: {csvExport: {enabled: true, columns: ['menuChoise']}}}, 'Admin export column references unknown field menuChoise'],
        ['csvExport valueLabels', {controls: {csvExport: {enabled: true, valueLabels: {menuChoise: {meat: 'admin.menu'}}}}}, 'Admin export value label references unknown field menuChoise'],
    ])('rejects an admin %s that names a field the form does not have', (_case, override, expected) => {
        // Given a panel configured against a field id that does not exist
        const admin = weddingInvitation.capabilities.admin
        const definition = {
            ...weddingInvitation,
            capabilities: {...weddingInvitation.capabilities, admin: {...admin, ...override}},
        } as unknown as typeof weddingInvitation

        // When the invitation is validated
        // Then it is rejected by name, instead of rendering an empty column
        expect(validateInvitationDefinition(definition)).toContain(expected)
    })

    it.each([
        ['transportFieldId', {transportFieldId: 'busOptions'}, 'Admin transport metric references unknown field busOptions'],
        ['dietaryFieldIds', {dietaryFieldIds: ['dietaryOption']}, 'Admin dietary metric references unknown field dietaryOption'],
        ['breakdownFieldIds', {breakdownFieldIds: ['menuchoice']}, 'Admin breakdown metric references unknown field menuchoice'],
    ])('rejects an admin metric %s that names a field the form does not have', (_case, override, expected) => {
        // Given a metric pointing at a field id that does not exist
        const admin = weddingInvitation.capabilities.admin
        const definition = {
            ...weddingInvitation,
            capabilities: {
                ...weddingInvitation.capabilities,
                admin: {...admin, metrics: {...admin!.metrics, ...override}},
            },
        } as unknown as typeof weddingInvitation

        // When the invitation is validated
        // Then it is rejected by name
        expect(validateInvitationDefinition(definition)).toContain(expected)
    })

    it('rejects an administrative capability without RSVP', () => {
        const definition = {
            ...weddingInvitation,
            capabilities: {
                ...weddingInvitation.capabilities,
                rsvp: {...weddingInvitation.capabilities.rsvp, enabled: false},
                admin: {...weddingInvitation.capabilities.admin, enabled: true},
            },
        }

        expect(validateInvitationDefinition(definition)).toContain('Admin requires the RSVP capability to be enabled')
    })

    it.each(['otp', 'password'] as const)('accepts the %s administrative authentication method', method => {
        const definition = {
            ...weddingInvitation,
            capabilities: {
                ...weddingInvitation.capabilities,
                admin: {...weddingInvitation.capabilities.admin, auth: {method}},
            },
        }

        expect(validateInvitationDefinition(definition)).toEqual([])
    })

    it.each([
        ['missing', undefined],
        ['unsupported', {method: 'magic-link'}],
    ])('rejects an administrative authentication method that is %s', (_case, auth) => {
        const definition = {
            ...weddingInvitation,
            capabilities: {
                ...weddingInvitation.capabilities,
                admin: {...weddingInvitation.capabilities.admin, auth},
            },
        }

        expect(validateInvitationDefinition(definition as unknown as typeof weddingInvitation)).toContain(
            'Admin requires a supported authentication method',
        )
    })

    // The state the ceremony card was in: two independent strings for one place, free to drift,
    // with nothing able to compare them semantically.
    it('rejects a venue item that declares both a displayed address and a map query', () => {
        const definition = {
            ...weddingInvitation,
            sections: weddingInvitation.sections.map(section => section.type === 'venue'
                ? {
                    ...section,
                    content: {
                        ...section.content,
                        items: section.content.items.map((item, index) => index === 0
                            ? {...item, address: 'venue.label' as const}
                            : item),
                    },
                }
                : section) as unknown as typeof weddingInvitation.sections,
        }

        expect(validateInvitationDefinition(definition)).toContain(
            'Venue section venue items must declare either address or mapsQuery, not both: '
            + 'the displayed text and the map destination would be free to disagree',
        )
    })

    it('rejects duplicate section identifiers', () => {
        const firstSection = weddingInvitation.sections[0]
        const definition = {...weddingInvitation, sections: [firstSection, firstSection]}

        expect(validateInvitationDefinition(definition)).toContain('Section ids must be unique')
    })

    it('rejects pagination options that omit the active page size', () => {
        const definition = {
            ...weddingInvitation,
            capabilities: {
                ...weddingInvitation.capabilities,
                admin: {
                    ...weddingInvitation.capabilities.admin,
                    controls: {
                        ...weddingInvitation.capabilities.admin.controls,
                        pagination: {
                            enabled: true,
                            pageSize: 10,
                            pageSizeSelector: {enabled: true, options: [20, 40]},
                        },
                    },
                },
            },
        }

        expect(validateInvitationDefinition(definition)).toContain(
            'Admin pagination pageSize must be included in pageSizeSelector options',
        )
    })

    it('rejects ambiguous event dates and invalid timezones', () => {
        const definition = {
            ...weddingInvitation,
            event: {...weddingInvitation.event, date: '2027-06-12', timezone: 'Madrid'},
        }

        expect(validateInvitationDefinition(definition)).toEqual(expect.arrayContaining([
            'Event date must be an ISO 8601 instant with an explicit offset',
            'Event timezone must be a valid IANA timezone',
        ]))
    })

    it('requires the RSVP deadline to precede the event', () => {
        const definition = {
            ...weddingInvitation,
            capabilities: {
                ...weddingInvitation.capabilities,
                rsvp: {...weddingInvitation.capabilities.rsvp, deadline: '2027-06-13T00:00:00+02:00'},
            },
        }

        expect(validateInvitationDefinition(definition)).toContain('RSVP deadline must be before the event date')
    })

    it('rejects empty structural content in enabled sections', () => {
        const cta = weddingInvitation.sections.find(section => section.type === 'rsvp-cta')
        if (!cta || cta.type !== 'rsvp-cta') throw new Error('Canonical RSVP CTA not found')
        const definition = {
            ...weddingInvitation,
            sections: [{...cta, content: {...cta.content, closedLabel: ''}}],
        }

        // El id sale de la seccion encontrada y no de un literal: `rsvp-cta` se puede declarar
        // mas de una vez, asi que atar la asercion a un id concreto la convertiria en una
        // asercion sobre el orden de declaracion.
        expect(validateInvitationDefinition(definition)).toContain(
            `RSVP CTA section ${cta.id} requires open and closed labels`,
        )
    })

    /**
     * Replaces the whole section list with one deliberately broken section, so only that
     * validation branch is under test. The cast is the point: these shapes must not typecheck.
     */
    function withOnlySection<Type extends WeddingSection['type']>(
        type: Type,
        mutate: (section: Extract<WeddingSection, { type: Type }>) => unknown,
    ) {
        const original = weddingInvitation.sections.find(section => section.type === type)
        if (!original) throw new Error(`Canonical ${type} section not found`)
        const broken = mutate(original as Extract<WeddingSection, { type: Type }>) as WeddingSection
        return {...weddingInvitation, sections: [broken]}
    }

    it('rejects a hero section with an incomplete message key', () => {
        const definition = withOnlySection('hero', section => ({
            ...section, content: {...section.content, subtitle: ''},
        }))

        expect(validateInvitationDefinition(definition)).toContain(
            'Hero section hero requires complete message keys',
        )
    })

    it('rejects a countdown section without its wedding-day label', () => {
        const definition = withOnlySection('countdown', section => ({
            ...section, content: {...section.content, todayLabel: ''},
        }))

        expect(validateInvitationDefinition(definition)).toContain(
            'Countdown section countdown requires complete message keys',
        )
    })

    it('rejects a video section without an asset', () => {
        const definition = withOnlySection('video', section => ({
            ...section, content: {...section.content, assetId: ''},
        }))

        expect(validateInvitationDefinition(definition)).toContain(
            'Video section video requires an asset and complete message keys',
        )
    })

    it.each([
        ['duplicated', 'ceremony', 'Venue section venue item ids must be unique'],
        ['not kebab-case', 'Ceremony', 'Venue section venue item ids must use lowercase kebab-case'],
    ])('rejects venue item ids that are %s', (_case, id, expected) => {
        const definition = withOnlySection('venue', section => ({
            ...section,
            content: {...section.content, items: section.content.items.map(item => ({...item, id}))},
        }))

        expect(validateInvitationDefinition(definition)).toContain(expected)
    })

    it('rejects a lodging section with no places to stay', () => {
        const definition = withOnlySection('lodging', section => ({
            ...section, content: {...section.content, items: []},
        }))

        expect(validateInvitationDefinition(definition)).toContain('Lodging section lodging requires an item')
    })

    it('rejects a lodging item without a booking URL', () => {
        const definition = withOnlySection('lodging', section => ({
            ...section,
            content: {...section.content, items: section.content.items.map(item => ({...item, bookingUrl: ''}))},
        }))

        expect(validateInvitationDefinition(definition)).toContain(
            'Lodging section lodging items require a name and a booking URL',
        )
    })

    it('rejects a price tier with no labels to render it', () => {
        const definition = withOnlySection('lodging', section => {
            const content = {...section.content} as Record<string, unknown>
            delete content.priceTierLabels
            return {...section, content}
        })

        expect(validateInvitationDefinition(definition)).toContain(
            'Lodging section lodging requires priceTierLabels when an item declares priceTier',
        )
    })

    it('rejects a declared deadline notice that names no message key', () => {
        const definition = withOnlySection('rsvp-cta', section => ({
            ...section, content: {...section.content, deadlineNotice: '   '},
        }))

        expect(validateInvitationDefinition(definition)).toContain(
            'RSVP CTA section rsvp-cta deadlineNotice must name a message key when declared',
        )
    })

    it('accepts a call to action that declares no deadline notice', () => {
        const definition = withOnlySection('rsvp-cta', section => {
            const content = {...section.content} as Record<string, unknown>
            delete content.deadlineNotice
            return {...section, content}
        })

        expect(validateInvitationDefinition(definition)).not.toContain(
            'RSVP CTA section rsvp-cta deadlineNotice must name a message key when declared',
        )
    })

    it('rejects a gifts section with more than two Bizum numbers', () => {
        const definition = withOnlySection('gifts', section => ({
            ...section,
            content: {
                ...section.content,
                account: {
                    ...section.content.account,
                    bizum: {
                        enabled: true,
                        labelKey: 'gifts.account.bizum',
                        numbers: [
                            {labelKey: 'hero.partnerOne', value: '+34 600 000 000'},
                            {labelKey: 'hero.partnerTwo', value: '+34 611 000 000'},
                            {labelKey: 'hero.partnerOne', value: '+34 622 000 000'},
                        ],
                    },
                },
            },
        }))

        expect(validateInvitationDefinition(definition)).toContain(
            'Gifts section gifts accepts at most two Bizum numbers',
        )
    })

    it('rejects an enabled Bizum with no number to copy', () => {
        const definition = withOnlySection('gifts', section => ({
            ...section,
            content: {
                ...section.content,
                account: {...section.content.account, bizum: {...section.content.account?.bizum, numbers: []}},
            },
        }))

        expect(validateInvitationDefinition(definition)).toContain(
            'Gifts section gifts requires a Bizum number when Bizum is enabled',
        )
    })

    it('accepts a disabled Bizum with no number to copy', () => {
        const definition = withOnlySection('gifts', section => ({
            ...section,
            content: {
                ...section.content,
                account: {...section.content.account, bizum: {...section.content.account?.bizum, enabled: false, numbers: []}},
            },
        }))

        expect(validateInvitationDefinition(definition)).not.toContain(
            'Gifts section gifts requires a Bizum number when Bizum is enabled',
        )
    })

    it.each([
        ['a label message key', {labelKey: '   ', value: '+34 600 000 000'}],
        ['a value', {labelKey: 'hero.partnerOne', value: ''}],
    ])('rejects a Bizum number without %s', (_case, number) => {
        const definition = withOnlySection('gifts', section => ({
            ...section,
            content: {
                ...section.content,
                account: {
                    ...section.content.account,
                    bizum: {...section.content.account?.bizum, numbers: [number]},
                },
            },
        }))

        expect(validateInvitationDefinition(definition)).toContain(
            'Gifts section gifts Bizum numbers require a label message key and a value',
        )
    })

    it('rejects a Bizum block with no name for the group', () => {
        const definition = withOnlySection('gifts', section => ({
            ...section,
            content: {
                ...section.content,
                account: {...section.content.account, bizum: {...section.content.account?.bizum, labelKey: ''}},
            },
        }))

        expect(validateInvitationDefinition(definition)).toContain(
            'Gifts section gifts Bizum requires a label message key',
        )
    })

    // Un valor mal escrito no rotula nada y deja salir la frase larga del formulario, que es lo
    // mismo que se veria sin declararlo: el fallo se esconde detras de su propio efecto.
    it('rejects an export value label that names an option the field does not have', () => {
        // Given an export label written against an option value that does not exist
        const admin = weddingInvitation.capabilities.admin
        const definition = {
            ...weddingInvitation,
            capabilities: {
                ...weddingInvitation.capabilities,
                admin: {
                    ...admin,
                    controls: {
                        ...admin?.controls,
                        csvExport: {enabled: true, valueLabels: {busOption: {roundtrip: 'admin.export.bus.roundTrip'}}},
                    },
                },
            },
        } as unknown as typeof weddingInvitation

        // When the invitation is validated
        // Then it is rejected by option and by field, instead of exporting the guest's sentence
        expect(validateInvitationDefinition(definition))
            .toContain('Admin export value label references unknown option roundtrip of field busOption')
    })

})

