import {useMemo, useState} from 'react'
import {isConditionMet, type FormAnswers, type FormDefinition, type FormErrors, type FormValue, validateElements} from '../../core/forms'

function createInitialAnswers<Message extends string>(definition: FormDefinition<Message>): FormAnswers {
    return Object.fromEntries(definition.steps.flatMap(step => step.elements).filter(element => element.type !== 'info').map(element => [element.id, element.initialValue ?? (element.type === 'checkbox-group' ? [] : '')]))
}

export function useFormEngine<Message extends string>(definition: FormDefinition<Message>) {
    const [answers, setAnswers] = useState<FormAnswers>(() => createInitialAnswers(definition))
    const [errors, setErrors] = useState<FormErrors>({})
    const [stepIndex, setStepIndex] = useState(0)
    const visibleSteps = useMemo(() => definition.steps.filter(step => isConditionMet(step.visibleWhen, answers)), [answers, definition.steps])
    const currentIndex = Math.min(stepIndex, Math.max(visibleSteps.length - 1, 0))
    const currentStep = visibleSteps[currentIndex]

    const setValue = (fieldId: string, value: FormValue) => {
        setAnswers(previous => ({...previous, [fieldId]: value}))
        setErrors(previous => { const next = {...previous}; delete next[fieldId]; return next })
    }

    const validateCurrent = () => {
        if (!currentStep) return false
        const nextErrors = validateElements(currentStep.elements, answers)
        setErrors(nextErrors)
        return Object.keys(nextErrors).length === 0
    }

    const completesForm = currentStep?.elements.some(element => (
        'options' in element && element.options.some(option => option.completesForm && option.value === answers[element.id])
    )) ?? false

    return {
        answers, errors, currentStep, currentIndex, visibleSteps,
        progress: visibleSteps.length ? ((currentIndex + 1) / visibleSteps.length) * 100 : 0,
        isFirst: currentIndex === 0,
        isLast: currentIndex === visibleSteps.length - 1,
        completesForm,
        setValue,
        validateCurrent,
        next: () => setStepIndex(index => Math.min(index + 1, visibleSteps.length - 1)),
        back: () => setStepIndex(index => Math.max(index - 1, 0)),
    }
}
