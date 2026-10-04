import React, { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react'
import { productApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmModal from '../components/ConfirmModal'

const emptyForm = { name: '', ean: '', category: '', unit: '', minimumStock: '' }
<<<<<<< HEAD
const fmtMoney = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
=======
const PAGE_SIZE = 20
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a

export default function Products({ showToast }) {
  const [products, setProducts] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

<<<<<<< HEAD
  const load = (name = search) => {
    setLoading(true)
    productApi.getAll({ active: true, ...(name.trim() ? { name: name.trim() } : {}) })
      .then(r => setProducts(r.data.content || []))
=======
  const load = (targetPage = 0, name = search) => {
    setLoading(true)
    productApi.list({ page: targetPage, size: PAGE_SIZE, sort: 'name', name: name || undefined })
      .then(data => {
        setProducts(data.content)
        setPage(data.page)
        setTotalPages(data.totalPages)
      })
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a
      .catch(() => showToast('Erro ao carregar produtos', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(0) }, [])

  const handleSearch = (val) => {
    setSearch(val)
<<<<<<< HEAD
    load(val)
=======
    load(0, val)
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Informe o nome do produto'
<<<<<<< HEAD
    if (form.ean.length > 14) e.ean = 'O código de barras deve ter no máximo 14 caracteres'
    if (form.minimumStock !== '' && (isNaN(form.minimumStock) || Number(form.minimumStock) < 0)) e.minimumStock = 'Informe uma quantidade válida'
=======
    if (form.minimumStock !== '' && (isNaN(form.minimumStock) || Number(form.minimumStock) < 0)) e.minimumStock = 'Informe um valor válido'
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const data = {
      name: form.name.trim(),
<<<<<<< HEAD
      ean: form.ean.trim() || null,
      category: form.category.trim() || null,
      unit: form.unit.trim() || null,
      minimumStock: form.minimumStock !== '' ? Number(form.minimumStock) : null
=======
      ean: form.ean.trim() || undefined,
      category: form.category.trim() || undefined,
      unit: form.unit.trim() || undefined,
      minimumStock: form.minimumStock !== '' ? Number(form.minimumStock) : undefined
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a
    }
    try {
      if (editing) {
        await productApi.update(editing.id, data)
        showToast('Produto atualizado com sucesso!')
      } else {
        await productApi.create(data)
        showToast('Produto cadastrado com sucesso! Use "Dar Entrada" para adicionar estoque.')
      }
      setShowForm(false); setEditing(null); setForm(emptyForm); setErrors({})
      load(page)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (p) => {
    setEditing(p)
    setForm({ name: p.name, ean: p.ean || '', category: p.category || '', unit: p.unit || '', minimumStock: p.minimumStock ?? '' })
    setShowForm(true)
    setErrors({})
  }

  const handleDelete = async () => {
    try {
      await productApi.deactivate(confirmDelete.id)
      showToast('Produto desativado com sucesso!')
      setConfirmDelete(null)
      load(page)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const formatCurrency = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const inp = (field) => ({
    className: `form-input${errors[field] ? ' error' : ''}`,
    value: form[field],
    onChange: (e) => setForm(p => ({ ...p, [field]: e.target.value }))
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Estoque</h1>
          <div className="eyebrow">{products.length} itens</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); setErrors({}) }}>
          <Plus size={18} /> Adicionar Produto
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={20} color="#9a9a92" />
          <input className="form-input" placeholder="Pesquisar produto por nome..." value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{ border: 'none', boxShadow: 'none', padding: '8px 0', fontSize: 16, flex: 1 }} />
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24, borderTop: '3px solid #ff7a00' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{editing ? 'Editar Produto' : 'Novo Produto'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 20px' }}>
              <div className="form-group">
                <label className="form-label">Nome do Produto <span>*</span></label>
                <input {...inp('name')} placeholder="Ex: Arroz 5kg" />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-group">
<<<<<<< HEAD
                <label className="form-label">Código de barras (EAN)</label>
                <input {...inp('ean')} maxLength={14} placeholder="Ex: 7891234567890" />
                {errors.ean && <span className="form-error">{errors.ean}</span>}
=======
                <label className="form-label">EAN (código de barras)</label>
                <input {...inp('ean')} placeholder="Ex: 7891234567890" maxLength={14} />
                <span className="form-hint">Usado para identificar o produto nas notas fiscais</span>
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a
              </div>
              <div className="form-group">
                <label className="form-label">Categoria</label>
                <input {...inp('category')} placeholder="Ex: Alimentos, Bebidas..." />
              </div>
              <div className="form-group">
                <label className="form-label">Unidade</label>
<<<<<<< HEAD
                <input {...inp('unit')} maxLength={20} placeholder="Ex: un, kg, L" />
              </div>
              <div className="form-group">
                <label className="form-label">Estoque Mínimo</label>
                <input {...inp('minimumStock')} type="number" min="0" step="any" placeholder="0" />
=======
                <input {...inp('unit')} placeholder="Ex: UN, KG, CX..." maxLength={20} />
              </div>
              <div className="form-group">
                <label className="form-label">Estoque Mínimo</label>
                <input {...inp('minimumStock')} type="number" min="0" placeholder="0" />
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a
                {errors.minimumStock && <span className="form-error">{errors.minimumStock}</span>}
                <span className="form-hint">Você será alertado quando o estoque chegar nesse valor</span>
              </div>
            </div>
<<<<<<< HEAD
            <p className="form-hint" style={{ marginBottom: 12 }}>O estoque é movimentado em "Dar Entrada" ou por notas fiscais.</p>
=======
            {!editing && (
              <div className="alert alert-warning">
                <AlertTriangle size={18} />
                <span>O estoque começa zerado. Depois de cadastrar, use "Dar Entrada" para registrar a chegada de produtos.</span>
              </div>
            )}
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); setEditing(null) }}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : (editing ? 'Salvar Alterações' : 'Cadastrar Produto')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? <LoadingSpinner /> : products.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <p>Nenhum produto encontrado</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>Clique em "Adicionar Produto" para começar</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>EAN</th>
                  <th>Categoria</th>
<<<<<<< HEAD
                  <th>Custo médio</th>
=======
                  <th>Custo Médio</th>
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a
                  <th>Em Estoque</th>
                  <th>Valor Total</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ opacity: p.active ? 1 : 0.6 }}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
<<<<<<< HEAD
                    </td>
                    <td><span style={{ fontFamily: 'monospace', background: '#f1f0ea', padding: '2px 8px', borderRadius: 4, fontSize: 13 }}>{p.ean || '—'}</span></td>
                    <td>{p.category || '—'}</td>
                    <td>{fmtMoney(p.averageCost)}</td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 18, color: Number(p.currentStock) <= 0 ? '#dc2626' : p.belowMinimum ? '#d97706' : '#16a34a' }}>
                        {p.currentStock}
                      </span>
                      {p.unit && <span style={{ fontSize: 12, color: '#9a9a92', marginLeft: 4 }}>{p.unit}</span>}
                      {p.minimumStock != null && <span style={{ fontSize: 12, color: '#9a9a92', marginLeft: 6 }}>mín: {p.minimumStock}</span>}
=======
                      {p.unit && <div style={{ fontSize: 13, color: '#64748b' }}>Unidade: {p.unit}</div>}
                    </td>
                    <td><span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: 13 }}>{p.ean || '—'}</span></td>
                    <td>{p.category || '—'}</td>
                    <td>{formatCurrency(p.averageCost)}</td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 18, color: p.currentStock <= 0 ? '#dc2626' : p.belowMinimum ? '#d97706' : '#16a34a' }}>
                        {p.currentStock}
                      </span>
                      {p.minimumStock != null && <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 6 }}>mín: {p.minimumStock}</span>}
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a
                    </td>
                    <td>{formatCurrency(p.totalValue)}</td>
                    <td>
<<<<<<< HEAD
                      {Number(p.currentStock) <= 0 ? <span className="badge badge-danger">Sem estoque</span>
                        : p.belowMinimum ? <span className="badge badge-warning"><AlertTriangle size={12} /> Estoque baixo</span>
                          : <span className="badge badge-success">Normal</span>}
=======
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {!p.active && <span className="badge badge-gray">Inativo</span>}
                        {p.currentStock <= 0 ? <span className="badge badge-danger">Sem estoque</span>
                          : p.belowMinimum ? <span className="badge badge-warning"><AlertTriangle size={12} /> Estoque baixo</span>
                            : <span className="badge badge-success">Normal</span>}
                      </div>
>>>>>>> 2c98cba2889e84364226a998f47309fdf06a5c8a
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-outline" style={{ padding: '7px 12px' }} onClick={() => handleEdit(p)}>
                          <Edit2 size={15} />
                        </button>
                        {p.active && (
                          <button className="btn" style={{ padding: '7px 12px', background: '#fee2e2', color: '#dc2626', border: 'none' }} onClick={() => setConfirmDelete(p)}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: 16, borderTop: '1px solid #e2e8f0' }}>
            <button className="btn btn-outline" disabled={page === 0} onClick={() => load(page - 1)}>Anterior</button>
            <span style={{ fontSize: 14, color: '#64748b' }}>Página {page + 1} de {totalPages}</span>
            <button className="btn btn-outline" disabled={page >= totalPages - 1} onClick={() => load(page + 1)}>Próxima</button>
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmModal title="Desativar produto?" message={`Tem certeza que deseja desativar "${confirmDelete.name}"? O produto não aparecerá mais na lista de ativos, mas o histórico será mantido.`}
          confirmLabel="Sim, desativar" danger onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  )
}
