import type {FormAnswers, VisibilityCondition} from './types'

export function isConditionMet(condition: VisibilityCondition | undefined, answers: FormAnswers): boolean {
    return !condition || answers[condition.fieldId] === condition.equals
}
