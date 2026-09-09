import type {FormDefinition} from '../../core/forms';
import type {RsvpRecordUpdate, RsvpSubmissionRecord} from '../../features/rsvp/domain/RsvpSubmission';
import {useLocalization} from '../../app/providers/useLocalization';
import {useEffect, useRef, useState} from 'react';
import type {WeddingMessageKey} from '../../invitations/wedding';
import {formatResponseValue, getFormFields} from '../../features/admin/presentation/responsePresentation';
import {InterfaceIcon} from '../ui/InterfaceIcon';
import {EditResponseModal} from './EditResponseModal';
import './ResponsesTable.css';

type Props = {
    responses: RsvpSubmissionRecord[]; loading: boolean; hasError: boolean;
    errorMessage: string | null; form: FormDefinition<WeddingMessageKey>; columns: readonly string[];
    /** Rotulos de cabecera por id, cuando la invitacion los declara. */
    columnLabels?: Readonly<Record<string, string>>;
    onRetry: () => void;
    onUpdate: (id: number, changes: Partial<RsvpRecordUpdate>) => Promise<boolean>;
    onDelete: (id: number) => void;
    onRestore: (id: number) => void;
    /** Id of the row whose last delete or restore failed, if any. */
    rowError: number | null;
    /**
     * Si el vacio lo produce un filtro o una busqueda, y no la ausencia de respuestas.
     *
     * `admin.empty` servia para los dos casos, asi que buscar un nombre mal escrito respondia
     * "No hay respuestas que mostrar" -- que suena a que nadie ha contestado -- y sin nada que
     * pulsar para deshacerlo.
     */
    isFiltered?: boolean;
    onClearFilters?: () => void;
};

export function ResponsesTable({responses, loading, hasError, errorMessage, form, columns, columnLabels, onRetry, onUpdate, onDelete, onRestore, rowError, isFiltered, onClearFilters}: Props) {
    const {t} = useLocalization<WeddingMessageKey>();
    const fields = getFormFields(form);
    // El rotulo del panel si la invitacion lo declara; la pregunta del formulario si no.
    const columnLabel = (id: string) => {
        const declared = columnLabels?.[id];
        if (declared) return t(declared as WeddingMessageKey);
        return fields.has(id) ? t(fields.get(id)!.label) : id;
    };
    const [editingId, setEditingId] = useState<number | null>(null)
    const [confirmingId, setConfirmingId] = useState<number | null>(null)
    const editingResponse = responses.find(item => item.id === editingId) ?? null

    return <section id="admin-responses" className="card responses-table" aria-busy={loading}
                    aria-label={t('admin.table.label')}>
        {hasError ?
            <div className="responses-state responses-state--error" role="alert">
                <InterfaceIcon name="alert-triangle" className="responses-state-icon"/>
                <span>{errorMessage ?? t('admin.loadError')}</span>
                <button type="button" className="btn btn--outline responses-retry" onClick={onRetry}>
                    {t('admin.retry')}
                </button>
            </div>
            : loading ? <div className="responses-state responses-state--muted" role="status" aria-live="polite">
                    <div className="responses-spinner"/>
                    {t('admin.loading')}</div>
                : responses.length === 0 ?
                    <div className="responses-state responses-state--muted" role="status">
                        <InterfaceIcon name="inbox" className="responses-state-icon"/>
                        <span>{t(isFiltered ? 'admin.empty.filtered' : 'admin.empty')}</span>
                        {isFiltered && onClearFilters && (
                            <button type="button" className="btn btn--outline responses-clear"
                                    onClick={onClearFilters}>
                                {t('admin.empty.clear')}
                            </button>
                        )}
                    </div>
                    : <div className="responses-scroll" role="region" aria-label={t('admin.table.label')} tabIndex={0}>
                        <table className="responses-table-el" role="table">
                            <caption className="sr-only">{t('admin.table.label')}</caption>
                            <thead role="rowgroup">
                            <tr className="responses-head-row" role="row">{columns.map(id => <th key={id} scope="col" role="columnheader"
                                                                                       className="responses-th">{columnLabel(id)}</th>)}<th scope="col" role="columnheader" className="responses-th">{t('admin.actions.label')}</th></tr>
                            </thead>
                            <tbody className="responses-body" role="rowgroup">{responses.map(response => <tr key={response.id} role="row"
                                                                                             className={`responses-row ${response.deletedAt ? 'responses-row--deleted' : ''}`}>
                                {columns.map(id => {
                                    const value = response.answers[id];
                                    const formattedValue = formatResponseValue(
                                        value,
                                        fields.get(id),
                                        t,
                                        {yes: 'common.yes', no: 'common.no'},
                                    );
                                    const label = columnLabel(id);
                                    // Vacio en el sentido del panel: sin valor que leer. En movil
                                    // la celda desaparece en vez de pintar un guion.
                                    const isEmpty = typeof value !== 'boolean'
                                        && (value === null || value === undefined || value === ''
                                            || (Array.isArray(value) && value.length === 0));
                                    return <td key={id} role="cell"
                                               className={`responses-td ${isEmpty ? 'responses-td--empty' : ''}`}>
                                        <span className="responses-cell-label" aria-hidden="true">{label}</span>
                                        {typeof value === 'boolean' ? <span
                                            className={`responses-badge responses-badge--${value ? 'yes' : 'no'}`}>
                                            <InterfaceIcon name={value ? 'check' : 'close'}
                                                           className="responses-badge-icon"/>
                                            {formattedValue}
                                        </span> : formattedValue}
                                    </td>;
                                })}
                                <td role="cell" className="responses-td">
                                    <div className="responses-actions">
                                        {/* Solo icono, con el nombre en `aria-label` y en `title`: la
                                            columna repetia "EDITAR" y "ELIMINAR" en cada fila y el
                                            texto tapaba el dato, que es lo que se viene a leer. El
                                            nombre accesible es el mismo de antes, asi que el lector
                                            de pantalla oye lo que oia. */}
                                        <button type="button" className="btn btn--ghost responses-action"
                                                aria-label={t('admin.actions.edit')}
                                                title={t('admin.actions.edit')}
                                                onClick={() => setEditingId(response.id)}>
                                            <InterfaceIcon name="pencil" className="responses-action-icon"/>
                                        </button>
                                        {response.deletedAt
                                            ? <button type="button" className="btn btn--ghost responses-action"
                                                      aria-label={t('admin.actions.restore')}
                                                      title={t('admin.actions.restore')}
                                                      onClick={() => onRestore(response.id)}>
                                                <InterfaceIcon name="rotate-ccw" className="responses-action-icon"/>
                                            </button>
                                            : confirmingId === response.id
                                                ? <DeleteConfirmation
                                                    guestName={String(response.answers.fullName ?? '')}
                                                    onConfirm={() => {
                                                        setConfirmingId(null)
                                                        onDelete(response.id)
                                                    }}
                                                    onDismiss={() => setConfirmingId(null)}/>
                                                : <button type="button"
                                                          className="btn btn--ghost responses-action responses-action--danger"
                                                          aria-label={t('admin.actions.delete')}
                                                          title={t('admin.actions.delete')}
                                                          onClick={() => setConfirmingId(response.id)}>
                                                    <InterfaceIcon name="trash" className="responses-action-icon"/>
                                                </button>}
                                    </div>
                                    {rowError === response.id && (
                                        <p className="responses-row-error" role="alert">{t('admin.actions.rowError')}</p>
                                    )}
                                </td>
                            </tr>)}</tbody>
                        </table>
                    </div>}
        {editingResponse && (
            <EditResponseModal
                response={editingResponse}
                form={form}
                columns={columns}
                onSave={async changes => {
                    const saved = await onUpdate(editingResponse.id, changes)
                    if (saved) setEditingId(null)
                    return saved
                }}
                onCancel={() => setEditingId(null)}
                saving={loading}
            />
        )}
    </section>;
}

type DeleteConfirmationProps = {
    guestName: string;
    onConfirm: () => void;
    onDismiss: () => void;
};

/**
 * Inline confirmation for a deletion, naming the guest whose answers are about to disappear.
 *
 * Inline rather than a dialog: it replaces the control the administrator just pressed, so the
 * answer stays beside the row it affects and no focus trap has to be maintained. Focus moves to
 * the dismissing button, because the control that had it no longer exists -- and because a stray
 * Enter should not delete a guest's answer.
 */
function DeleteConfirmation({guestName, onConfirm, onDismiss}: Readonly<DeleteConfirmationProps>) {
    const {t} = useLocalization<WeddingMessageKey>();
    const dismissRef = useRef<HTMLButtonElement>(null);
    const question = t('admin.actions.confirmDelete').replace('{guest}', guestName);

    useEffect(() => {
        dismissRef.current?.focus();
    }, []);

    return <div className="responses-confirm" role="group" aria-label={question}>
        <p className="responses-confirm-question">{question}</p>
        <p className="responses-confirm-hint">{t('admin.actions.confirmDeleteHint')}</p>
        <div className="responses-confirm-actions">
            <button type="button"
                    className="btn btn--ghost"
                    onClick={onConfirm}>
                {t('admin.actions.confirmDeleteYes')}
            </button>
            <button type="button" ref={dismissRef} className="btn btn--ghost"
                    onClick={onDismiss}>
                {t('admin.actions.confirmDeleteNo')}
            </button>
        </div>
    </div>;
}
