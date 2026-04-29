import React, { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react'
import { productApi } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmModal from '../components/ConfirmModal'

const emptyForm = { name: '', sku: '', description: '', category: '', unitPrice: '', quantityInStock: '', minimumStock: '' }

export default function Products({ showToast }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = () => {
    setLoading(true)
    productApi.getAll()
      .then(r => setProducts(r.data))
      .catch(() => showToast('Erro ao carregar produtos', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSearch = async (val) => {
    setSearch(val)
    if (!val.trim()) { load(); return }
    try {
      const r = await productApi.search(val)
      setProducts(r.data)
    } catch {}
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Informe o nome do produto'
    if (!form.sku.trim()) e.sku = 'Informe o código do produto'
    if (!form.unitPrice || isNaN(form.unitPrice) || Number(form.unitPrice) < 0) e.unitPrice = 'Informe um preço válido'
    if (form.quantityInStock === '' || isNaN(form.quantityInStock) || Number(form.quantityInStock) < 0) e.quantityInStock = 'Informe a quantidade inicial'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const data = { ...form, unitPrice: parseFloat(form.unitPrice), quantityInStock: parseInt(form.quantityInStock), minimumStock: form.minimumStock ? parseInt(form.minimumStock) : null }
    try {
      if (editing) {
        await productApi.update(editing.id, data)
        showToast('Produto atualizado com sucesso!')
      } else {
        await productApi.create(data)
        showToast('Produto cadastrado com sucesso!')
      }
      setShowForm(false); setEditing(null); setForm(emptyForm); setErrors({})
      load()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (p) => {
    setEditing(p)
    setForm({ name: p.name, sku: p.sku, description: p.description || '', category: p.category || '', unitPrice: p.unitPrice, quantityInStock: p.quantityInStock, minimumStock: p.minimumStock || '' })
    setShowForm(true)
    setErrors({})
  }

  const handleDelete = async () => {
    try {
      await productApi.deactivate(confirmDelete.id)
      showToast('Produto desativado com sucesso!')
      setConfirmDelete(null)
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const inp = (field) => ({
    className: `form-input${errors[field] ? ' error' : ''}`,
    value: form[field],
    onChange: (e) => setForm(p => ({ ...p, [field]: e.target.value }))
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Produtos</h1>
          <p className="page-subtitle">Gerencie os produtos do seu estoque</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); setErrors({}) }}>
          <Plus size={18} /> Adicionar Produto
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={20} color="#94a3b8" />
          <input className="form-input" placeholder="Pesquisar produto por nome..." value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{ border: 'none', boxShadow: 'none', padding: '8px 0', fontSize: 16, flex: 1 }} />
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24, borderTop: '3px solid #2563eb' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{editing ? 'Editar Produto' : 'Novo Produto'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 20px' }}>
              <div className="form-group">
                <label className="form-label">Nome do Produto <span>*</span></label>
                <input {...inp('name')} placeholder="Ex: Arroz 5kg" />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Código (SKU) <span>*</span></label>
                <input {...inp('sku')} placeholder="Ex: ARR-5KG-01" />
                {errors.sku && <span className="form-error">{errors.sku}</span>}
                <span className="form-hint">Código único para identificar o produto</span>
              </div>
              <div className="form-group">
                <label className="form-label">Categoria</label>
                <input {...inp('category')} placeholder="Ex: Alimentos, Bebidas..." />
              </div>
              <div className="form-group">
                <label className="form-label">Preço Unitário (R$) <span>*</span></label>
                <input {...inp('unitPrice')} type="number" step="0.01" min="0" placeholder="0,00" />
                {errors.unitPrice && <span className="form-error">{errors.unitPrice}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Quantidade Inicial <span>*</span></label>
                <input {...inp('quantityInStock')} type="number" min="0" placeholder="0" />
                {errors.quantityInStock && <span className="form-error">{errors.quantityInStock}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Quantidade Mínima</label>
                <input {...inp('minimumStock')} type="number" min="0" placeholder="0" />
                <span className="form-hint">Você será alertado quando o estoque chegar nesse valor</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descrição</label>
              <input {...inp('description')} placeholder="Informações adicionais sobre o produto" />
            </div>
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
                  <th>Código</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Em Estoque</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: 13, color: '#64748b' }}>{p.description}</div>}
                    </td>
                    <td><span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontSize: 13 }}>{p.sku}</span></td>
                    <td>{p.category || '—'}</td>
                    <td>R$ {Number(p.unitPrice).toFixed(2).replace('.', ',')}</td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 18, color: p.quantityInStock === 0 ? '#dc2626' : p.belowMinimumStock ? '#d97706' : '#16a34a' }}>
                        {p.quantityInStock}
                      </span>
                      {p.minimumStock && <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 6 }}>mín: {p.minimumStock}</span>}
                    </td>
                    <td>
                      {p.quantityInStock === 0 ? <span className="badge badge-danger">Sem estoque</span>
                        : p.belowMinimumStock ? <span className="badge badge-warning"><AlertTriangle size={12} /> Estoque baixo</span>
                          : <span className="badge badge-success">Normal</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-outline" style={{ padding: '7px 12px' }} onClick={() => handleEdit(p)}>
                          <Edit2 size={15} />
                        </button>
                        <button className="btn" style={{ padding: '7px 12px', background: '#fee2e2', color: '#dc2626', border: 'none' }} onClick={() => setConfirmDelete(p)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmModal title="Desativar produto?" message={`Tem certeza que deseja desativar "${confirmDelete.name}"? O produto não aparecerá mais na lista, mas o histórico será mantido.`}
          confirmLabel="Sim, desativar" danger onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  )
}
