import React, { useEffect, useRef, useState } from 'react'
import { FileText, QrCode, Check, X, Trash2, Image } from 'lucide-react'
import { invoiceApi, productApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmModal from '../components/ConfirmModal'

const statusConfig = {
  PENDING: { label: 'Pendente', cls: 'badge-warning' },
  FETCHED: { label: 'Aguardando revisão', cls: 'badge-warning' },
  CONFIRMED: { label: 'Confirmada', cls: 'badge-success' },
  REJECTED: { label: 'Rejeitada', cls: 'badge-danger' },
  ERROR: { label: 'Erro', cls: 'badge-danger' }
}

const fmtMoney = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d) => d ? new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString('pt-BR') : '—'

function InvoiceItemsPanel({ invoice, editable, products, onItemUpdated, showToast }) {
  const [drafts, setDrafts] = useState({})
  const [savingId, setSavingId] = useState(null)

  const getDraft = (item) => drafts[item.id] || { productName: item.productName, quantity: item.quantity, mergeIntoProductId: '' }
  const updateDraft = (item, patch) => setDrafts(d => ({ ...d, [item.id]: { ...getDraft(item), ...patch } }))

  const handleSave = async (item) => {
    const draft = getDraft(item)
    const body = {}
    if (draft.productName !== item.productName) body.productName = draft.productName
    if (Number(draft.quantity) !== Number(item.quantity)) body.quantity = Number(draft.quantity)
    if (draft.mergeIntoProductId) body.mergeIntoProductId = draft.mergeIntoProductId
    if (Object.keys(body).length === 0) return
    setSavingId(item.id)
    try {
      const updated = await invoiceApi.reviewItem(invoice.id, item.id, body)
      onItemUpdated(updated)
      showToast('Item atualizado.')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingId(null)
    }
  }

  const handleToggleIgnored = async (item) => {
    setSavingId(item.id)
    try {
      const updated = await invoiceApi.reviewItem(invoice.id, item.id, { ignored: !item.ignored })
      onItemUpdated(updated)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingId(null)
    }
  }

  const visibleTotal = (invoice.items || []).filter(i => !i.ignored).reduce((sum, i) => sum + Number(i.totalValue || 0), 0)

  if (!(invoice.items || []).length) return <span style={{ color: '#9a9a92' }}>Sem itens.</span>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {invoice.items.map(item => {
        const draft = getDraft(item)
        return (
          <div key={item.id} style={{ padding: '10px 12px', borderRadius: 8, background: 'white', border: '1px solid #e6e4dc', opacity: item.ignored ? 0.55 : 1 }}>
            {editable ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>Nome do produto</label>
                  <input className="form-input" value={draft.productName} onChange={e => updateDraft(item, { productName: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>Quantidade</label>
                  <input className="form-input" type="number" min="0" step="any" value={draft.quantity} onChange={e => updateDraft(item, { quantity: e.target.value })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 12 }}>Juntar com produto existente</label>
                  <select className="form-input" value={draft.mergeIntoProductId} onChange={e => updateDraft(item, { mergeIntoProductId: e.target.value })}>
                    <option value="">— manter como está —</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-outline" style={{ padding: '7px 12px' }} disabled={savingId === item.id} onClick={() => handleSave(item)}>
                    {savingId === item.id ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button type="button" className="btn" style={{ padding: '7px 12px', background: item.ignored ? '#dcfce7' : '#fee2e2', color: item.ignored ? '#16a34a' : '#dc2626', border: 'none' }}
                    disabled={savingId === item.id} onClick={() => handleToggleIgnored(item)}>
                    {item.ignored ? 'Reconsiderar' : 'Ignorar'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span>
                  {item.productName} <span style={{ color: '#9a9a92' }}>{item.productEan}</span>
                  {item.ignored && <span className="badge badge-gray" style={{ marginLeft: 8 }}>Ignorado</span>}
                </span>
                <span>{item.quantity} {item.unit} × {fmtMoney(item.unitValue)} = <strong>{fmtMoney(item.totalValue)}</strong></span>
              </div>
            )}
          </div>
        )
      })}
      {editable && (
        <div style={{ textAlign: 'right', fontSize: 14, color: '#4a4a46', marginTop: 4 }}>
          Total a entrar no estoque (itens não ignorados): <strong>{fmtMoney(visibleTotal)}</strong>
        </div>
      )}
    </div>
  )
}

export default function Invoices({ showToast }) {
  const [invoices, setInvoices] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [qrCode, setQrCode] = useState('')
  const [processing, setProcessing] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const fileInputRef = useRef(null)

  const load = () => {
    setLoading(true)
    invoiceApi.list()
      .then(data => setInvoices(data.content || []))
      .catch(() => showToast('Erro ao carregar notas fiscais', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    productApi.list({ active: true, size: 500, sort: 'name' })
      .then(data => setProducts(data.content || []))
      .catch(() => {})
  }, [])

  const handleProcess = async (e) => {
    e.preventDefault()
    if (!qrCode.trim()) return
    setProcessing(true)
    try {
      await invoiceApi.processQrCode(qrCode.trim())
      showToast('Nota processada! Revise os itens e confirme a entrada.')
      setQrCode('')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setProcessing(true)
    try {
      await invoiceApi.processImage(file)
      showToast('Nota processada a partir da imagem! Revise os itens e confirme a entrada.')
      load()
    } catch (err) {
      showToast(err.message, 'error')
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
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    const inv = confirmDelete
    setConfirmDelete(null)
    await act(inv.id, invoiceApi.remove, 'Nota fiscal excluída.')
  }

  const handleItemUpdated = (updatedInvoice) => {
    setInvoices(prev => prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv))
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notas Fiscais</h1>
          <p className="page-subtitle">Importe NFC-e pelo QR Code, revise os itens e confirme a entrada no estoque</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <form onSubmit={handleProcess} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <QrCode size={20} color="#6b6b66" />
          <input className="form-input" style={{ flex: 1, minWidth: 260 }} placeholder="Cole aqui o link / conteúdo do QR Code da NFC-e"
            value={qrCode} onChange={e => setQrCode(e.target.value)} />
          <button type="submit" className="btn btn-primary" disabled={processing || !qrCode.trim()}>
            {processing ? 'Processando...' : 'Processar nota'}
          </button>
          <span style={{ color: '#9a9a92', fontSize: 13 }}>ou</span>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/bmp" style={{ display: 'none' }} onChange={handleImageChange} />
          <button type="button" className="btn btn-outline" disabled={processing} onClick={() => fileInputRef.current?.click()}>
            <Image size={16} /> Enviar foto do QR Code
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <LoadingSpinner /> : invoices.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>Nenhuma nota fiscal importada</p>
          </div>
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
                  const reviewable = inv.status === 'FETCHED' || inv.status === 'PENDING'
                  const editable = inv.status === 'FETCHED'
                  return (
                    <React.Fragment key={inv.id}>
                      <tr>
                        <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(inv.purchaseDate)}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{inv.supplierName || '—'}</div>
                          <div style={{ fontSize: 12, color: '#9a9a92' }}>{inv.supplierCnpj}</div>
                        </td>
                        <td>{fmtMoney(inv.totalValue)}</td>
                        <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button className="btn btn-outline" style={{ padding: '7px 12px' }}
                              onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}>
                              {expanded === inv.id ? 'Ocultar itens' : `Itens (${inv.items?.length || 0})`}
                            </button>
                            {reviewable && (
                              <>
                                <button className="btn btn-success" style={{ padding: '7px 12px' }} disabled={busyId === inv.id}
                                  onClick={() => act(inv.id, invoiceApi.confirm, 'Nota confirmada e estoque atualizado!')}>
                                  <Check size={15} /> Confirmar
                                </button>
                                <button className="btn btn-outline" style={{ padding: '7px 12px' }} disabled={busyId === inv.id}
                                  onClick={() => act(inv.id, invoiceApi.reject, 'Nota rejeitada.')}>
                                  <X size={15} /> Rejeitar
                                </button>
                              </>
                            )}
                            <button className="btn" style={{ padding: '7px 12px', background: '#fee2e2', color: '#dc2626', border: 'none' }}
                              disabled={busyId === inv.id} onClick={() => setConfirmDelete(inv)} aria-label="Excluir nota">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expanded === inv.id && (
                        <tr>
                          <td colSpan={5} style={{ background: '#f6f5f0' }}>
                            {editable && (
                              <p style={{ fontSize: 13, color: '#6b6b66', marginBottom: 10 }}>
                                Revise os itens antes de confirmar: renomeie, junte com um produto já cadastrado, ajuste a quantidade ou ignore o que não deve entrar no estoque.
                              </p>
                            )}
                            <InvoiceItemsPanel invoice={inv} editable={editable} products={products} onItemUpdated={handleItemUpdated} showToast={showToast} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmModal title="Excluir nota fiscal?" message="Tem certeza que deseja excluir esta nota fiscal?"
          confirmLabel="Sim, excluir" danger onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  )
}
