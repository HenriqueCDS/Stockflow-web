import React, { useEffect, useState } from 'react'
import { FileText, QrCode, Check, X, Trash2 } from 'lucide-react'
import { invoiceApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmModal from '../components/ConfirmModal'

const statusConfig = {
  PENDING: { label: 'Pendente', cls: 'badge-warning' },
  FETCHED: { label: 'Aguardando confirmação', cls: 'badge-warning' },
  CONFIRMED: { label: 'Confirmada', cls: 'badge-success' },
  REJECTED: { label: 'Rejeitada', cls: 'badge-danger' },
  ERROR: { label: 'Erro', cls: 'badge-danger' }
}

const fmtMoney = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d) => d ? new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString('pt-BR') : '—'

export default function Invoices({ showToast }) {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [qrCode, setQrCode] = useState('')
  const [processing, setProcessing] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = () => {
    setLoading(true)
    invoiceApi.getAll()
      .then(r => setInvoices(r.data.content || []))
      .catch(() => showToast('Erro ao carregar notas fiscais', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleProcess = async (e) => {
    e.preventDefault()
    if (!qrCode.trim()) return
    setProcessing(true)
    try {
      const r = await invoiceApi.processQrCode(qrCode.trim())
      showToast('Nota processada! Revise os itens e confirme a entrada.')
      setQrCode('')
      setExpanded(r.data?.id || null)
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notas Fiscais</h1>
          <p className="page-subtitle">Importe NFC-e pelo QR Code e dê entrada no estoque automaticamente</p>
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
                  <th>Fornecedor</th>
                  <th>Total</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const st = statusConfig[inv.status] || { label: inv.status, cls: '' }
                  const reviewable = inv.status === 'FETCHED' || inv.status === 'PENDING'
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
                            {(inv.items || []).length === 0 ? <span style={{ color: '#9a9a92' }}>Sem itens.</span> : inv.items.map(it => (
                              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                                <span>{it.productName} <span style={{ color: '#9a9a92' }}>{it.productEan}</span></span>
                                <span>{it.quantity} {it.unit} × {fmtMoney(it.unitValue)} = <strong>{fmtMoney(it.totalValue)}</strong></span>
                              </div>
                            ))}
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
