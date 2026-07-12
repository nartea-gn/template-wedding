import type {InvitationSection} from '../../core/invitation'
import type {SectionRegistry} from './types'

export function createSectionRegistry<Message extends string>(
    registry: SectionRegistry<Message>,
): SectionRegistry<Message> {
    return registry
}

export function hasSectionRenderer<Message extends string>(
    registry: SectionRegistry<Message>,
    type: string,
): type is InvitationSection<Message>['type'] {
    return Object.hasOwn(registry, type)
}
