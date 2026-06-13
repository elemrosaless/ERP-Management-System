import { useEffect, useMemo, useState } from 'react'
import { createProduct, deleteProduct, getProducts, updateProduct } from '../services/api.js'

const initialForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
}

function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    setLoading(true)
    setError('')
    try {
      const data = await getProducts(100)
      setProducts(data.products || [])
    } catch (err) {
      setError(err.message || 'No se pudo cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  function handleInputChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const productData = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
    }

    if (!productData.name || Number.isNaN(productData.price) || Number.isNaN(productData.stock)) {
      setError('Completa nombre, precio y stock correctamente.')
      return
    }

    try {
      if (editingId) {
        await updateProduct(editingId, productData)
        setSuccess('Producto actualizado correctamente.')
      } else {
        await createProduct(productData)
        setSuccess('Producto creado correctamente.')
      }
      setForm(initialForm)
      setEditingId(null)
      await loadProducts()
    } catch (err) {
      setError(err.message || 'Error al guardar el producto')
    }
  }

  function handleEdit(product) {
    setEditingId(product.id)
    setForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      stock: String(product.stock),
    })
    setError('')
    setSuccess('')
  }

  function handleCancelEdit() {
    setEditingId(null)
    setForm(initialForm)
    setError('')
    setSuccess('')
  }

  async function handleDelete(productId) {
    if (!window.confirm('¿Eliminar este producto?')) {
      return
    }
    setError('')
    setSuccess('')

    try {
      await deleteProduct(productId)
      setSuccess('Producto eliminado correctamente.')
      await loadProducts()
    } catch (err) {
      setError(err.message || 'Error al eliminar el producto')
    }
  }

  const formTitle = editingId ? 'Editar producto' : 'Nuevo producto'

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="page-header">
          <div>
            <h1 className="page-title">Productos</h1>
            <p className="page-text">Administra el catálogo de productos del ERP.</p>
          </div>
        </div>

        <section className="section-card">
          <h2>{formTitle}</h2>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Nombre
              <input name="name" value={form.name} onChange={handleInputChange} />
            </label>
            <label>
              Descripción
              <input name="description" value={form.description} onChange={handleInputChange} />
            </label>
            <label>
              Precio
              <input name="price" type="number" step="0.01" value={form.price} onChange={handleInputChange} />
            </label>
            <label>
              Stock
              <input name="stock" type="number" value={form.stock} onChange={handleInputChange} />
            </label>
            <div className="form-actions">
              <button type="submit" className="button">
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
              {editingId && (
                <button type="button" className="button secondary" onClick={handleCancelEdit}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
          {error && <div className="error-banner">{error}</div>}
          {success && <div className="success-banner">{success}</div>}
        </section>

        <section className="section-card">
          <h2>Lista de productos</h2>
          {loading ? (
            <div className="info-banner">Cargando productos...</div>
          ) : error ? (
            <div className="error-banner">{error}</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.name}</td>
                      <td>${product.price.toFixed(2)}</td>
                      <td>{product.stock}</td>
                      <td className="row-actions">
                        <button type="button" className="button secondary small" onClick={() => handleEdit(product)}>
                          Editar
                        </button>
                        <button type="button" className="button danger small" onClick={() => handleDelete(product.id)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Products
