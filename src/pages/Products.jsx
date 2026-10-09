import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle, Check, XCircle, PackagePlus, X, FileText } from 'lucide-react'
import { productApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmModal from '../components/ConfirmModal'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import ActionMenu from '../components/ActionMenu'
import useDebounce from '../hooks/useDebounce'

const emptyForm = { name: '', ean: '', category: '', unit: '', minimumStock: '' }
const PAGE_SIZE = 20
const FULL_SIZE = 500

const isOut = p => Number(p.currentStock) <= 0
const isLow = p => !isOut(p) && p.belowMinimum

const FILTERS = [
  { key: 'todos', label: 'Todos' },
  { key: 'baixo', label: 'Estoque baixo' },
  { key: 'sem', label: 'Sem estoque' },
]

export default function Products({ showToast }) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const situacao = FILTERS.some(f => f.key === params.get('situacao')) ? params.get('situacao') : 'todos'

  const [products, setProducts] = useState([])
  const [counts, setCounts] = useState({ todos: 0, baixo: 0, sem: 0 })
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [quantities, setQuantities] = useState({})

  const getQuantity = (productId) => Math.max(1, Number(quantities[productId] ?? 1) || 1)
  const setQuantity = (productId, value) => setQuantities(q => ({ ...q, [productId]: value }))

  const loadCounts = useCallback(() => {
    productApi.list({ page: 0, size: FULL_SIZE, active: true })
      .then(data => setCounts({
        todos: data.totalElements ?? data.content.length,
        baixo: data.content.filter(isLow).length,
        sem: data.content.filter(isOut).length,
      }))
      .catch(() => {})
  }, [])

  const load = useCallback((targetPage = 0) => {
    setLoading(true)
    setError(false)
    const filtered = situacao !== 'todos'
    productApi.list({
      page: filtered ? 0 : targetPage, size: filtered ? FULL_SIZE : PAGE_SIZE, sort: 'name', active: true,
      name: debouncedSearch.trim() || undefined
    })
      .then(data => {
        let list = data.content
        if (situacao === 'baixo') list = list.filter(isLow)
        if (situacao === 'sem') list = list.filter(isOut)
        setProducts(list)
        setPage(filtered ? 0 : data.page)
        setTotalPages(filtered ? 1 : data.totalPages)
        setTotalElements(filtered ? list.length : (data.totalElements ?? list.length))
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [debouncedSearch, situacao])

  useEffect(() => { load(0) }, [load])
  useEffect(() => { loadCounts() }, [loadCounts])

  const setSituacao = (key) => {
    const next = new URLSearchParams(params)
    if (key === 'todos') next.delete('situacao'); else next.set('situacao', key)
    setParams(next, { replace: true })
  }

  const openForm = (product = null, prefillName = '') => {
    setEditing(product)
    setForm(product
      ? { name: product.name, ean: product.ean || '', category: product.category || '', unit: product.unit || '', minimumStock: product.minimumStock ?? '' }
      : { ...emptyForm, name: prefillName })
    setErrors({})
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm); setErrors({}) }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Informe o nome do produto'
    if (form.ean.length > 14) e.ean = 'O código de barras deve ter no máximo 14 caracteres'
    if (form.minimumStock !== '' && (isNaN(form.minimumStock) || Number(form.minimumStock) < 0)) e.minimumStock = 'Informe uma quantidade válida'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const data = {
      name: form.name.trim(),
      ean: form.ean.trim() || null,
      category: form.category.trim() || null,
      unit: form.unit.trim() || null,
      minimumStock: form.minimumStock !== '' ? Number(form.minimumStock) : null
    }
    try {
      if (editing) {
        await productApi.update(editing.id, data)
        showToast('Produto atualizado com sucesso!')
      } else {
        await productApi.create(data)
        showToast('Produto cadastrado com sucesso! Use "Dar Entrada" para adicionar estoque.')
      }
      closeForm()
      load(page)
      loadCounts()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleQuickAction = async (product, action, label) => {
    const quantity = getQuantity(product.id)
    setBusyId(product.id)
    try {
      const movement = await action(product.id, quantity)
      setProducts(ps => ps.map(x => x.id === product.id ? { ...x, currentStock: movement.stockAfter } : x))
      setQuantity(product.id, 1)
      showToast(`${label} de ${quantity} unidade(s) registrado para "${product.name}"!`)
      loadCounts()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    try {
      await productApi.deactivate(confirmDelete.id)
      showToast('Produto desativado com sucesso!')
      setConfirmDelete(null)
      load(page)
      loadCounts()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const inp = (field) => ({
    className: `form-input${errors[field] ? ' error' : ''}`,
    value: form[field],
    onChange: (e) => setForm(p => ({ ...p, [field]: e.target.value }))
  })

  const searching = debouncedSearch.trim() !== ''
  const filtering = situacao !== 'todos'

  const renderEmpty = () => {
    if (searching) {
      return (
        <EmptyState icon={Search} title={`Nada encontrado para "${debouncedSearch.trim()}"`} text="Confira a grafia ou cadastre o produto agora.">
          <button className="btn btn-outline" onClick={() => setSearch('')}>Limpar busca</button>
          <button className="btn btn-primary" onClick={() => openForm(null, debouncedSearch.trim())}>
            <Plus size={16} /> Cadastrar "{debouncedSearch.trim()}"
          </button>
        </EmptyState>
      )
    }
    if (filtering) {
      return (
        <EmptyState icon={Package} title="Nenhum produto nessa situação" text="Tudo certo por aqui.">
          <button className="btn btn-outline" onClick={() => setSituacao('todos')}>Ver todos</button>
        </EmptyState>
      )
    }
    return (
      <EmptyState icon={Package} title="Seu estoque está vazio" text="Importe uma nota fiscal ou cadastre os produtos da sua casa.">
        <button className="btn btn-outline" onClick={() => navigate('/notas')}><FileText size={16} /> Importar nota</button>
        <button className="btn btn-primary" onClick={() => openForm()}><Plus size={16} /> Cadastrar produto</button>
      </EmptyState>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Estoque</h1>
          <div className="eyebrow">{totalElements} {totalElements === 1 ? 'item' : 'itens'}</div>
        </div>
        <button className="btn btn-primary" onClick={() => openForm()}>
          <Plus size={18} /> Adicionar Produto
        </button>
      </div>

      {/* Search + filtros */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={20} color="var(--muted)" />
          <input className="form-input" placeholder="Pesquisar produto por nome..." value={search}
            aria-label="Pesquisar produto"
            onChange={e => setSearch(e.target.value)}
            style={{ border: 'none', boxShadow: 'none', padding: '8px 0', fontSize: 16, flex: 1, background: 'transparent' }} />
          {search && <button onClick={() => setSearch('')} aria-label="Limpar busca" style={{ background: 'none', border: 'none', color: 'var(--muted)' }}><X size={18} /></button>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          {FILTERS.map(f => (
            <button key={f.key} className={`chip${situacao === f.key ? ' active' : ''}`} onClick={() => setSituacao(f.key)}>
              {f.label} <span className="count">{counts[f.key]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? <LoadingSpinner /> : error ? (
          <ErrorState onRetry={() => load(page)} />
        ) : products.length === 0 ? renderEmpty() : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>EAN</th>
                  <th>Categoria</th>
                  <th>Em Estoque</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const q = getQuantity(p.id)
                  const stock = Number(p.currentStock)
                  const cannotUse = busyId === p.id || stock <= 0 || q > stock
                  return (
                    <tr key={p.id} style={{ opacity: p.active ? 1 : 0.6 }}>
                      <td><div style={{ fontWeight: 600 }}>{p.name}</div></td>
                      <td><span style={{ fontFamily: 'var(--mono)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 4, fontSize: 13 }}>{p.ean || '—'}</span></td>
                      <td>{p.category || '—'}</td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: 18, color: stock <= 0 ? 'var(--bad)' : p.belowMinimum ? 'var(--warn)' : 'var(--good)' }}>
                          {p.currentStock}
                        </span>
                        {p.unit && <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>{p.unit}</span>}
                        {p.minimumStock != null && <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 6 }}>mín: {p.minimumStock}</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {!p.active && <span className="badge badge-gray">Inativo</span>}
                          {stock <= 0 ? <span className="badge badge-danger">Sem estoque</span>
                            : p.belowMinimum ? <span className="badge badge-warning"><AlertTriangle size={12} /> Estoque baixo</span>
                              : <span className="badge badge-success">Normal</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {p.active && (
                            <>
                              <div className="stepper" role="group" aria-label={`Quantidade para ${p.name}`}>
                                <button onClick={() => setQuantity(p.id, Math.max(1, q - 1))} disabled={q <= 1} aria-label="Diminuir">−</button>
                                <span>{q}</span>
                                <button onClick={() => setQuantity(p.id, q + 1)} disabled={q >= stock} aria-label="Aumentar">+</button>
                              </div>
                              <button className="btn btn-success" style={{ padding: '7px 12px' }}
                                disabled={cannotUse}
                                onClick={() => handleQuickAction(p, productApi.use, 'Uso')} title={`Usei ${q} unidade(s)`}>
                                <Check size={15} /> Usei
                              </button>
                            </>
                          )}
                          <ActionMenu items={[
                            { label: 'Descartei', icon: XCircle, hidden: !p.active || cannotUse, onClick: () => handleQuickAction(p, productApi.discard, 'Descarte') },
                            { label: 'Editar', icon: Edit2, onClick: () => openForm(p) },
                            { label: 'Dar entrada', icon: PackagePlus, hidden: !p.active, onClick: () => navigate(`/entrada?produto=${p.id}`) },
                            { label: 'Desativar', icon: Trash2, danger: true, hidden: !p.active, onClick: () => setConfirmDelete(p) },
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

        {!loading && !error && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: 16, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-outline" disabled={page === 0} onClick={() => load(page - 1)}>Anterior</button>
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>Página {page + 1} de {totalPages}</span>
            <button className="btn btn-outline" disabled={page >= totalPages - 1} onClick={() => load(page + 1)}>Próxima</button>
          </div>
        )}
      </div>

      {/* Formulário em modal (a tabela não se mexe mais) */}
      {showForm && (
        <div onClick={closeForm} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div role="dialog" aria-modal="true" aria-labelledby="product-form-title" onClick={e => e.stopPropagation()}
            onKeyDown={e => e.key === 'Escape' && closeForm()}
            className="card" style={{ maxWidth: 620, width: '100%', maxHeight: '90vh', overflowY: 'auto', borderTop: '3px solid var(--primary)' }}>
            <h2 id="product-form-title" style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{editing ? 'Editar Produto' : 'Novo Produto'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 20px' }}>
                <div className="form-group">
                  <label className="form-label">Nome do Produto <span>*</span></label>
                  <input {...inp('name')} placeholder="Ex: Arroz 5kg" autoFocus />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Código de barras (EAN)</label>
                  <input {...inp('ean')} maxLength={14} placeholder="Ex: 7891234567890" />
                  {errors.ean && <span className="form-error">{errors.ean}</span>}
                  <span className="form-hint">Usado para identificar o produto nas notas fiscais</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <input {...inp('category')} placeholder="Ex: Alimentos, Bebidas..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Unidade</label>
                  <input {...inp('unit')} maxLength={20} placeholder="Ex: un, kg, L" />
                </div>
                <div className="form-group">
                  <label className="form-label">Estoque Mínimo</label>
                  <input {...inp('minimumStock')} type="number" min="0" step="any" placeholder="0" />
                  {errors.minimumStock && <span className="form-error">{errors.minimumStock}</span>}
                  <span className="form-hint">Você será alertado quando o estoque chegar nesse valor</span>
                </div>
              </div>
              {!editing && (
                <div className="alert alert-warning">
                  <AlertTriangle size={18} />
                  <span>O estoque começa zerado. Depois de cadastrar, use "Dar Entrada" para registrar a chegada de produtos.</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={closeForm}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : (editing ? 'Salvar Alterações' : 'Cadastrar Produto')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal title="Desativar produto?" message={`Tem certeza que deseja desativar "${confirmDelete.name}"? O produto não aparecerá mais na lista de ativos, mas o histórico será mantido.`}
          confirmLabel="Sim, desativar" danger onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  )
}
