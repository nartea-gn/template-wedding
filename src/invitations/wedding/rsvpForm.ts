import type {FormDefinition} from '../../core/forms'
import type {WeddingMessageKey} from './locales/es'

export const weddingRsvpForm = {
    // Bump the version whenever the privacy notice or the consent wording changes: the stored
    // version is what proves which text a guest actually consented to.
    id: 'wedding-rsvp', version: 2,
    submission: {identityFieldId: 'fullName', attendanceFieldId: 'attending'},
    privacyNotice: 'rsvp.privacy.notice',
    messages: {
        next: 'rsvp.next',
        back: 'rsvp.back',
        submit: 'rsvp.submit',
        submitting: 'rsvp.submitting',
        submitError: 'rsvp.error.submit',
        errors: {
            required: 'form.error.required',
            email: 'form.error.email',
            minLength: 'form.error.minLength',
            maxLength: 'form.error.maxLength',
            minWords: 'form.error.minWords'
        }
    },
    steps: [
        {
            id: 'attendance',
            title: 'rsvp.step.attendance.title',
            subtitle: 'rsvp.step.attendance.subtitle',
            elements: [
                {
                    id: 'fullName',
                    type: 'text',
                    label: 'rsvp.fullName.label',
                    help: 'rsvp.fullName.help',
                    placeholder: 'rsvp.fullName.placeholder',
                    required: true,
                    initialValue: '',
                    validation: {minWords: 2, maxLength: 120}
                },
                {
                    id: 'attending',
                    type: 'radio',
                    label: 'rsvp.attending.label',
                    required: true,
                    initialValue: null,
                    options: [{value: true, label: 'rsvp.attending.yes', icon: 'heart'}, {
                        value: false,
                        label: 'rsvp.attending.no',
                        completesForm: true,
                        icon: 'heart-broken'
                    }]
                },
            ]
        },
        {
            id: 'meal',
            title: 'rsvp.step.meal.title',
            subtitle: 'rsvp.step.meal.subtitle',
            visibleWhen: {fieldId: 'attending', equals: true},
            elements: [
                {
                    id: 'dietaryConsent',
                    type: 'radio',
                    label: 'rsvp.dietary.consent.label',
                    help: 'rsvp.dietary.consent.help',
                    required: true,
                    initialValue: null,
                    options: [
                        {value: true, label: 'rsvp.dietary.consent.yes'},
                        {value: false, label: 'rsvp.dietary.consent.no'}
                    ]
                },
                {
                    id: 'dietaryOptions',
                    type: 'checkbox-group',
                    label: 'rsvp.dietary.label',
                    visibleWhen: {fieldId: 'dietaryConsent', equals: true},
                    initialValue: [],
                    options: [{value: 'none', label: 'rsvp.dietary.none'}, {
                        value: 'gluten',
                        label: 'rsvp.dietary.gluten'
                    }, {value: 'vegetarian', label: 'rsvp.dietary.vegetarian'}, {
                        value: 'lactose',
                        label: 'rsvp.dietary.lactose'
                    }, {value: 'nuts_seafood', label: 'rsvp.dietary.nutsSeafood'}]
                },
                {
                    id: 'dietaryOther',
                    type: 'text',
                    label: 'rsvp.dietary.other',
                    visibleWhen: {fieldId: 'dietaryConsent', equals: true},
                    placeholder: 'rsvp.dietary.other',
                    initialValue: '',
                    validation: {maxLength: 300}
                },
                {
                    id: 'busOption',
                    type: 'select',
                    label: 'rsvp.bus.label',
                    placeholder: 'rsvp.bus.placeholder',
                    initialValue: '',
                    options: [{value: 'ida_vuelta', label: 'rsvp.bus.roundTrip'}, {
                        value: 'solo_ida',
                        label: 'rsvp.bus.outbound'
                    }, {value: 'solo_vuelta', label: 'rsvp.bus.return'}, {value: 'no', label: 'rsvp.bus.no'}]
                },
            ]
        },
        {
            id: 'music',
            title: 'rsvp.step.music.title',
            subtitle: 'rsvp.step.music.subtitle',
            visibleWhen: {fieldId: 'attending', equals: true},
            elements: [{id: 'giftInfo', type: 'info', label: 'rsvp.gift.info'}, {
                id: 'songRequest',
                type: 'text',
                label: 'rsvp.song.label',
                placeholder: 'rsvp.song.placeholder',
                initialValue: '',
                validation: {maxLength: 160}
            }]
        },
        {
            id: 'message',
            title: 'rsvp.step.message.title',
            subtitle: 'rsvp.step.message.subtitle',
            visibleWhen: {fieldId: 'attending', equals: true},
            elements: [{
                id: 'message',
                type: 'textarea',
                label: 'rsvp.message.label',
                placeholder: 'rsvp.message.placeholder',
                initialValue: '',
                validation: {maxLength: 1000}
            }]
        },
    ],
} as const satisfies FormDefinition<WeddingMessageKey>
