import type {FormAnswers, VisibilityCondition} from './types.ts'

export function isConditionMet(condition: VisibilityCondition | undefined, answers: FormAnswers): boolean {
    return !condition || answers[condition.fieldId] === condition.equals
}

/**
 * Whether a condition cannot be decided yet, because the field it reads is still unanswered.
 *
 * {@link isConditionMet} collapses "not applicable" and "not decided yet" into one `false`, and
 * the form engine counted steps with it: on the first step, with `attending` still `null`, the
 * three conditional steps read as hidden, so the guest was shown a full progress bar and a final
 * submit button on step one of four. Telling the two apart lets the engine count a step that may
 * still unlock while leaving out one the answers have genuinely ruled out.
 */
export function isConditionUndetermined(
    condition: VisibilityCondition | undefined,
    answers: FormAnswers,
): boolean {
    if (!condition || isConditionMet(condition, answers)) return false
    const answer = answers[condition.fieldId]
    return answer === null
        || answer === undefined
        || answer === ''
        || (Array.isArray(answer) && answer.length === 0)
}
