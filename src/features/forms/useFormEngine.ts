import {useCallback, useEffect, useMemo, useState} from 'react'
import {
    type FormAnswers,
    type FormDefinition,
    type FormErrors,
    type FormValue,
    isConditionMet,
    isConditionUndetermined,
    validateElements
} from '../../core/forms'

function createInitialAnswers<Message extends string>(definition: FormDefinition<Message>): FormAnswers {
    return Object.fromEntries(definition.steps.flatMap(step => step.elements).filter(element => element.type !== 'info').map(element => [element.id, element.initialValue ?? (element.type === 'checkbox-group' ? [] : '')]))
}

/** Field ids the draft is allowed to hold: everything not marked `sensitive`. */
function draftableIds<Message extends string>(definition: FormDefinition<Message>): Set<string> {
    return new Set(definition.steps
        .flatMap(step => step.elements)
        .filter(element => element.type !== 'info' && !('sensitive' in element && element.sensitive))
        .map(element => element.id))
}

// Versioned: a form whose questions changed must not restore answers to questions that no longer
// exist, and `version` is already bumped whenever the consent wording does.
function draftKey<Message extends string>(definition: FormDefinition<Message>): string {
    return `nartea:form-draft:${definition.id}:v${definition.version}`
}

/**
 * The saved draft, or nothing.
 *
 * Every access is guarded: Safari throws on `localStorage` in private mode, and a corrupted or
 * hand-edited value must not stop the form rendering. Losing a draft is a small cost; failing to
 * open the form is not.
 */
function readDraft<Message extends string>(definition: FormDefinition<Message>): FormAnswers {
    try {
        const raw = window.localStorage.getItem(draftKey(definition))
        if (!raw) return {}
        const parsed: unknown = JSON.parse(raw)
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
        const allowed = draftableIds(definition)
        return Object.fromEntries(
            Object.entries(parsed as Record<string, FormValue>).filter(([id]) => allowed.has(id)),
        ) as FormAnswers
    } catch {
        return {}
    }
}

export function useFormEngine<Message extends string>(definition: FormDefinition<Message>) {
    const [answers, setAnswers] = useState<FormAnswers>(() => ({
        ...createInitialAnswers(definition),
        ...readDraft(definition),
    }))
    const [errors, setErrors] = useState<FormErrors>({})
    const [stepIndex, setStepIndex] = useState(0)
    const visibleSteps = useMemo(() => definition.steps.filter(step => isConditionMet(step.visibleWhen, answers)), [answers, definition.steps])
    /**
     * The steps the guest may still be asked for, which is what the progress bar has to count.
     *
     * `visibleSteps` answers "what can be rendered right now" and is the right basis for
     * navigation. It is the wrong basis for progress: a step gated on an unanswered field is not
     * absent, it is undecided, and counting it as absent is what put a 100% bar and a "submit"
     * button on step one of four.
     */
    const reachableSteps = useMemo(() => definition.steps.filter(step => (
        isConditionMet(step.visibleWhen, answers) || isConditionUndetermined(step.visibleWhen, answers)
    )), [answers, definition.steps])
    const currentIndex = Math.min(stepIndex, Math.max(visibleSteps.length - 1, 0))
    const currentStep = visibleSteps[currentIndex]

    const setValue = (fieldId: string, value: FormValue) => {
        setAnswers(previous => ({...previous, [fieldId]: value}))
        setErrors(previous => {
            const next = {...previous};
            delete next[fieldId];
            return next
        })
    }

    /**
     * Answers with every currently hidden field removed.
     *
     * A guest who fills in a conditional field and then revokes the condition must not send that
     * value. It matters most for the dietary consent: the allergies of someone who changed their
     * mind are article 9 health data with no legal basis behind them.
     */
    const visibleAnswers = useMemo(() => {
        const hidden = new Set(
            definition.steps
                .filter(step => !isConditionMet(step.visibleWhen, answers))
                .flatMap(step => step.elements)
                .map(element => element.id),
        )
        for (const step of definition.steps) {
            for (const element of step.elements) {
                if (!isConditionMet(element.visibleWhen, answers)) hidden.add(element.id)
            }
        }
        return Object.fromEntries(Object.entries(answers).filter(([id]) => !hidden.has(id))) as FormAnswers
    }, [answers, definition.steps])

    /**
     * Keeps the answers across an interruption, minus the health data.
     *
     * A guest interrupted on step three of four used to come back to an empty form: the answers
     * lived in component state alone, and `localStorage` held only the chosen locale. What it
     * must not hold is anything marked `sensitive` -- see {@link visibleAnswers}, which strips
     * the same fields from the submission for the same reason.
     */
    useEffect(() => {
        try {
            const allowed = draftableIds(definition)
            const draft = Object.fromEntries(Object.entries(answers).filter(([id]) => allowed.has(id)))
            window.localStorage.setItem(draftKey(definition), JSON.stringify(draft))
        } catch {
            // A full or unavailable store is not worth interrupting the form for.
        }
    }, [answers, definition])

    const clearDraft = useCallback(() => {
        try {
            window.localStorage.removeItem(draftKey(definition))
        } catch {
            // Nothing to recover from: the draft is a convenience, not a record.
        }
    }, [definition])

    const validateCurrent = () => {
        if (!currentStep) return false
        const nextErrors = validateElements(currentStep.elements, answers)
        setErrors(nextErrors)
        return Object.keys(nextErrors).length === 0
    }

    const completesForm = currentStep?.elements.some(element => (
        'options' in element && element.options.some(option => option.completesForm && option.value === answers[element.id])
    )) ?? false

    const stepCount = Math.max(reachableSteps.length, visibleSteps.length)

    return {
        answers, visibleAnswers, errors, currentStep, currentIndex, visibleSteps,
        progress: stepCount ? ((currentIndex + 1) / stepCount) * 100 : 0,
        stepNumber: currentIndex + 1,
        stepCount,
        isFirst: currentIndex === 0,
        isLast: currentIndex === stepCount - 1,
        completesForm,
        setValue,
        validateCurrent,
        clearDraft,
        next: () => setStepIndex(index => Math.min(index + 1, visibleSteps.length - 1)),
        back: () => setStepIndex(index => Math.max(index - 1, 0)),
    }
}
