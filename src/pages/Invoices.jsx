import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, QrCode, Check, X, Trash2, Image, AlertTriangle, RefreshCw, Eye, Pencil } from 'lucide-react'
import { invoiceApi, productApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmModal from '../components/ConfirmModal'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import ActionMenu from '../components/ActionMenu'

const statusConfig = {
  PENDING: { label: 'Pendente', cls: 'badge-warning' },
  FETCHED: { label: 'Aguardando revisão', cls: 'badge-warning' },
  CONFIRMED: { label: 'Confirmada', cls: 'badge-success' },
  REJECTED: { label: 'Rejeitada', cls: 'badge-danger' },
  ERROR: { label: 'Erro', cls: 'badge-danger' }
}

const fmtMoney = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d) => d ? new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString('pt-BR') : '—'
const fmtNum = (v) => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 })

function ItemRow({ invoice, item, editable, products, onItemUpdated, showToast }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({ productName: item.productName, quantity: item.quantity, mergeIntoProductId: '' })
  const [saving, setSaving] = useState(false)

  const linked = item.productId != null
  const tag = item.ignored ? { text: 'ignorado', cls: 'badge-gray' } : linked ? { text: 'vinculado', cls: 'badge-success' } : { text: 'novo', cls: 'badge-info' }

  const save = async () => {
    const body = {}
    if (draft.productName !== item.productName) body.productName = draft.productName
    if (Number(draft.quantity) !== Number(item.quantity)) body.quantity = Number(draft.quantity)
    if (draft.mergeIntoProductId) body.mergeIntoProductId = draft.mergeIntoProductId
    if (Object.keys(body).length === 0) return setOpen(false)
    setSaving(true)
    try {
      onItemUpdated(await invoiceApi.reviewItem(invoice.id, item.id, body))
      showToast('Item atualizado.')
      setOpen(false)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleIgnored = async () => {
    setSaving(true)
    try {
      onItemUpdated(await invoiceApi.reviewItem(invoice.id, item.id, { ignored: !item.ignored }))
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ borderBottom: '1px solid var(--border)', padding: '10px 0', opacity: item.ignored ? 0.55 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, textDecoration: item.ignored ? 'line-through' : 'none' }}>{item.productName}</div>
          {item.productEan && <div className="metric-note" style={{ fontFamily: 'var(--mono)' }}>{item.productEan}</div>}
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 14, whiteSpace: 'nowrap' }}>{fmtNum(item.quantity)} {item.unit}</span>
        <span className={`badge ${tag.cls}`}>{tag.text}</span>
        {editable && (
          <>
            <button className="btn btn-outline" style={{ padding: '5px 8px' }} aria-label="Editar item" aria-expanded={open} onClick={() => setOpen(o => !o)}><Pencil size={14} /></button>
            <button className="btn btn-outline" style={{ padding: '5px 8px' }} aria-label={item.ignored ? 'Reconsiderar item' : 'Ignorar item'} disabled={saving} onClick={toggleIgnored}>
              {item.ignored ? <Check size={14} /> : <X size={14} />}
            </button>
          </>
        )}
      </div>
      {open && (
        <div style={{ display: 'grid', gap: 10, marginTop: 10, padding: 12, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 12 }}>Nome do produto</label>
            <input className="form-input" value={draft.productName} onChange={e => setDraft(d => ({ ...d, productName: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 12 }}>Quantidade</label>
            <input className="form-input" type="number" min="0" step="any" value={draft.quantity} onChange={e => setDraft(d => ({ ...d, quantity: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 12 }}>Juntar com produto existente</label>
            <select className="form-input" value={draft.mergeIntoProductId} onChange={e => setDraft(d => ({ ...d, mergeIntoProductId: e.target.value }))}>
              <option value="">— manter como está —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" style={{ padding: '7px 12px' }} onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" style={{ padding: '7px 12px' }} disabled={saving} onClick={save}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewPanel({ invoice, editable, products, busy, onClose, onItemUpdated, onConfirm, onReject, showToast }) {
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const items = invoice.items || []
  const active = items.filter(i => !i.ignored)
  const units = active.reduce((s, i) => s + Number(i.quantity || 0), 0)

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'var(--overlay)', display: 'flex', justifyContent: 'flex-end' }}>
      <aside role="dialog" aria-modal="true" aria-labelledby="review-title" onClick={e => e.stopPropagation()}
        style={{ width: 'min(560px, 100%)', height: '100%', background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h2 id="review-title" style={{ fontSize: 18, fontWeight: 700 }}>{editable ? 'Revisar nota' : 'Itens da nota'}</h2>
            <div className="metric-note">{invoice.supplierName || 'Mercado'} · {fmtDate(invoice.purchaseDate)} · {fmtMoney(invoice.totalValue)}</div>
          </div>
          <button onClick={onClose} aria-label="Fechar" style={{ background: 'none', border: 'none', color: 'var(--muted)' }}><X size={22} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px' }}>
          {editable && (
            <p className="metric-note" style={{ padding: '8px 0' }}>
              Renomeie, junte com um produto já cadastrado, ajuste a quantidade ou ignore o que não deve entrar no estoque.
            </p>
          )}
          {items.length === 0
            ? <EmptyState icon={FileText} title="Sem itens" text="Esta nota não trouxe itens." />
            : items.map(item => <ItemRow key={item.id} invoice={invoice} item={item} editable={editable} products={products} onItemUpdated={onItemUpdated} showToast={showToast} />)}
        </div>

        {editable && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <div style={{ marginBottom: 12, fontSize: 14 }}>
              Entram no estoque: <strong>{fmtNum(units)} unidades · {active.length} {active.length === 1 ? 'produto' : 'produtos'}</strong>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" disabled={busy} onClick={onReject}><X size={16} /> Rejeitar nota</button>
              <button className="btn btn-success" disabled={busy || active.length === 0} onClick={onConfirm}><Check size={16} /> Confirmar entrada</button>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

export default function Invoices({ showToast }) {
  const [invoices, setInvoices] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [processing, setProcessing] = useState(false)
  const [importError, setImportError] = useState('')
  const [reviewingId, setReviewingId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const fileInputRef = useRef(null)

  const load = useCallback(() => {
    setLoading(true)
    setLoadError(false)
    invoiceApi.list()
      .then(data => setInvoices(data.content || []))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    productApi.list({ active: true, size: 500, sort: 'name' })
      .then(data => setProducts(data.content || []))
      .catch(() => {})
  }, [load])

  const submitQr = async (code) => {
    setProcessing(true)
    setImportError('')
    try {
      await invoiceApi.processQrCode(code)
      showToast('Nota processada! Revise os itens e confirme a entrada.')
      setQrCode('')
      load()
    } catch (err) {
      setImportError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleProcess = (e) => {
    e.preventDefault()
    if (qrCode.trim()) submitQr(qrCode.trim())
  }

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setProcessing(true)
    setImportError('')
    try {
      await invoiceApi.processImage(file)
      showToast('Nota processada a partir da imagem! Revise os itens e confirme a entrada.')
      load()
    } catch (err) {
      setImportError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const act = async (id, fn, okMsg) => {
    setBusyId(id)
    try {
      await fn(id)
      showToast(okMsg)
      load()
      return true
    } catch (err) {
      showToast(err.message, 'error')
      return false
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    const inv = confirmDelete
    setConfirmDelete(null)
    if (reviewingId === inv.id) setReviewingId(null)
    await act(inv.id, invoiceApi.remove, 'Nota fiscal excluída.')
  }

  const handleItemUpdated = (updated) => setInvoices(prev => prev.map(inv => inv.id === updated.id ? updated : inv))

  const awaiting = invoices.filter(i => i.status === 'FETCHED')
  const reviewing = invoices.find(i => i.id === reviewingId)

  const mainAction = (inv) => {
    if (inv.status === 'FETCHED' || inv.status === 'PENDING')
      return <button className="btn btn-primary" style={{ padding: '7px 12px' }} onClick={() => setReviewingId(inv.id)}><Eye size={15} /> Revisar</button>
    if (inv.status === 'ERROR' && inv.qrCode)
      return <button className="btn btn-outline" style={{ padding: '7px 12px' }} disabled={processing} onClick={() => submitQr(inv.qrCode)}><RefreshCw size={15} /> Tentar de novo</button>
    if (inv.status === 'CONFIRMED' || inv.status === 'REJECTED')
      return <button className="btn btn-outline" style={{ padding: '7px 12px' }} onClick={() => setReviewingId(inv.id)}>Ver itens ({inv.items?.length || 0})</button>
    return null
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notas Fiscais</h1>
          <p className="page-subtitle">Importe NFC-e pelo QR Code, revise os itens e confirme a entrada no estoque</p>
        </div>
      </div>

      {awaiting.length > 0 && (
        <div className="alert alert-warning" role="status" style={{ alignItems: 'center' }}>
          <AlertTriangle size={20} />
          <span style={{ flex: 1 }}><strong>{awaiting.length} {awaiting.length === 1 ? 'nota aguardando' : 'notas aguardando'} revisão</strong></span>
          <button className="btn btn-primary" style={{ padding: '7px 14px' }} onClick={() => setReviewingId(awaiting[0].id)}>Revisar agora</button>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20, border: '2px dashed var(--border-strong)' }}>
        <form onSubmit={handleProcess} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <QrCode size={20} color="var(--muted)" />
          <input className="form-input" style={{ flex: 1, minWidth: 260 }} placeholder="Cole aqui o link / conteúdo do QR Code da NFC-e"
            aria-label="Link do QR Code" value={qrCode} onChange={e => setQrCode(e.target.value)} />
          <button type="submit" className="btn btn-primary" disabled={processing || !qrCode.trim()}>
            {processing ? 'Processando...' : 'Processar nota'}
          </button>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>ou</span>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/bmp" style={{ display: 'none' }} onChange={handleImageChange} />
          <button type="button" className="btn btn-outline" disabled={processing} onClick={() => fileInputRef.current?.click()}>
            <Image size={16} /> Enviar foto
          </button>
        </form>
        {importError && (
          <div className="alert alert-danger" role="alert" style={{ marginTop: 14, marginBottom: 0 }}>
            <AlertTriangle size={18} /><span>{importError}</span>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <LoadingSpinner /> : loadError ? (
          <ErrorState onRetry={load} />
        ) : invoices.length === 0 ? (
          <EmptyState icon={FileText} title="Nenhuma nota fiscal importada" text="Cole o link do QR Code ou envie uma foto da nota para dar entrada no estoque automaticamente." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Mercado</th>
                  <th>Total</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const st = statusConfig[inv.status] || { label: inv.status, cls: '' }
                  return (
                    <tr key={inv.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(inv.purchaseDate)}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{inv.supplierName || '—'}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{inv.supplierCnpj}</div>
                      </td>
                      <td>{fmtMoney(inv.totalValue)}</td>
                      <td>
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                        {inv.status === 'ERROR' && inv.errorMessage && (
                          <div style={{ fontSize: 12, color: 'var(--bad)', marginTop: 4, maxWidth: 260 }}>{inv.errorMessage}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {mainAction(inv)}
                          <ActionMenu items={[
                            { label: 'Rejeitar nota', icon: X, hidden: !(inv.status === 'FETCHED' || inv.status === 'PENDING'), onClick: () => act(inv.id, invoiceApi.reject, 'Nota rejeitada.') },
                            { label: 'Excluir', icon: Trash2, danger: true, onClick: () => setConfirmDelete(inv) },
                          ]} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reviewing && (
        <ReviewPanel invoice={reviewing} editable={reviewing.status === 'FETCHED'} products={products} busy={busyId === reviewing.id}
          onClose={() => setReviewingId(null)} onItemUpdated={handleItemUpdated} showToast={showToast}
          onConfirm={async () => { if (await act(reviewing.id, invoiceApi.confirm, 'Nota confirmada e estoque atualizado!')) setReviewingId(null) }}
          onReject={async () => { if (await act(reviewing.id, invoiceApi.reject, 'Nota rejeitada.')) setReviewingId(null) }} />
      )}

      {confirmDelete && (
        <ConfirmModal title="Excluir nota fiscal?" message="Tem certeza que deseja excluir esta nota fiscal?"
          confirmLabel="Sim, excluir" danger onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  )
}
