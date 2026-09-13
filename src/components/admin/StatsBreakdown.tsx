import './StatsBreakdown.css';
import type {FormDefinition, FormElement} from '../../core/forms';
import {useLocalization} from '../../app/providers/useLocalization';
import type {WeddingMessageKey} from '../../invitations/wedding';

type Breakdown = {
    fieldId: string;
    tally: Readonly<Record<string, number>>;
};

type StatsBreakdownProps<Message extends string> = {
    breakdowns: readonly Breakdown[];
    form: FormDefinition<Message>;
};

function findField<Message extends string>(form: FormDefinition<Message>, fieldId: string) {
    return form.steps.flatMap(step => step.elements).find(element => element.id === fieldId);
}

function hasOptions<Message extends string>(
    element: FormElement<Message> | undefined,
): element is Extract<FormElement<Message>, { options: readonly unknown[] }> {
    return Boolean(element && 'options' in element);
}

/**
 * How the attending guests split across a choice field.
 *
 * The headline cards answer "how many are coming"; a caterer asks "how many of each", and the
 * couple was counting that by hand on the exported CSV. It reads the options from the form rather
 * than from the stored values, so the order matches the question the guest answered and an option
 * nobody picked still shows its zero -- which is the number a caterer needs to see stated, not
 * inferred from an absence.
 */
export function StatsBreakdown<Message extends string>(
    {
        breakdowns,
        form,
    }: Readonly<StatsBreakdownProps<Message>>) {
    const {t} = useLocalization<WeddingMessageKey>();
    const sections = breakdowns
        .map(({fieldId, tally}) => ({field: findField(form, fieldId), tally}))
        .filter(section => hasOptions(section.field));

    if (sections.length === 0) return null;

    return <>
        {sections.map(({field, tally}) => {
            const element = field as Extract<FormElement<Message>, { options: readonly { value: unknown; label: Message }[] }>;
            return (
                <section key={element.id} className="breakdown" aria-label={t('admin.breakdown.label')}>
                    <h2 className="breakdown-title">{t(element.label as unknown as WeddingMessageKey)}</h2>
                    <ul className="breakdown-list">
                        {element.options.map(option => (
                            <li key={String(option.value)} className="card breakdown-item">
                                <span className="breakdown-label">
                                    {t(option.label as unknown as WeddingMessageKey)}
                                </span>
                                <span className="breakdown-value">{tally[String(option.value)] ?? 0}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            );
        })}
    </>;
}
