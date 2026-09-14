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
    labels?: Readonly<Record<string, string>>;
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
 *
 * A last card closes the arithmetic the options leave open: how many plates the counts add up to.
 * It is not the "attending" card repeated -- it counts the guests who answered this question, and
 * an attending guest who left it blank is in one number and not the other. The gap between the two
 * is the one the caterer pays for, so it is worth being able to see it.
 */
export function StatsBreakdown<Message extends string>(
    {
        breakdowns,
        form,
        labels,
    }: Readonly<StatsBreakdownProps<Message>>) {
    const {t} = useLocalization<WeddingMessageKey>();
    const sections = breakdowns
        .map(({fieldId, tally}) => ({field: findField(form, fieldId), tally}))
        .filter(section => hasOptions(section.field));

    if (sections.length === 0) return null;

    return <>
        {sections.map(({field, tally}) => {
            const element = field as Extract<FormElement<Message>, { options: readonly { value: unknown; label: Message }[] }>;
            const counts = element.options.map(option => ({option, count: tally[String(option.value)] ?? 0}));
            const total = counts.reduce((sum, {count}) => sum + count, 0);
            const title = labels?.[element.id] ?? element.label;
            return (
                <section key={element.id} className="breakdown" aria-label={t('admin.breakdown.label')}>
                    <h2 className="breakdown-title">{t(title as unknown as WeddingMessageKey)}</h2>
                    <ul className="breakdown-list">
                        {counts.map(({option, count}) => (
                            <li key={String(option.value)} className="card breakdown-item">
                                <span className="breakdown-value">{count}</span>
                                <span className="breakdown-label">
                                    {t(option.label as unknown as WeddingMessageKey)}
                                </span>
                            </li>
                        ))}
                        <li className="card breakdown-item breakdown-item--total">
                            <span className="breakdown-value">{total}</span>
                            <span className="breakdown-label">{t('admin.breakdown.total')}</span>
                            <span className="breakdown-note">{t('admin.breakdown.totalNote')}</span>
                        </li>
                    </ul>
                </section>
            );
        })}
    </>;
}
