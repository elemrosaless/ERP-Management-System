import { useEffect, useMemo, useState } from 'react'
import { createSale, fetchRecentSales, getProducts } from '../services/api.js'

const emptyItem = {
  product_id: '',
  quantity: '1',
  price: '0',
  subtotal: '0',
}

function Sales() {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState([emptyItem])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [productsData, recentSales] = await Promise.all([
        getProducts(100),
        fetchRecentSales(10),
      ])
      setProducts(productsData.products || [])
      setSales(recentSales.recent_sales || [])
    } catch (err) {
      setError(err.message || 'Error al cargar ventas')
    } finally {
      setLoading(false)
    }
  }

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0),
    [items]
  )

  function handleItemChange(index, field, value) {
    setItems((current) =>
      current.map((item, idx) => {
        if (idx !== index) return item
        const updated = { ...item, [field]: value }
        if (field === 'product_id') {
          const selected = products.find((product) => String(product.id) === String(value))
          updated.price = selected ? String(selected.price) : updated.price
        }
        if (field === 'quantity' || field === 'price' || field === 'product_id') {
          const quantity = Number(updated.quantity || 0)
          const price = Number(updated.price || 0)
          updated.subtotal = (quantity * price).toFixed(2)
        }
        return updated
      })
    )
  }

  function addItem() {
    setItems((current) => [...current, emptyItem])
  }

  function removeItem(index) {
    setItems((current) => current.filter((_, idx) => idx !== index))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!customerId.trim()) {
      setError('Ingresa el ID de cliente.')
      return
    }

    const parsedItems = items
      .filter((item) => item.product_id)
      .map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      }))

    if (parsedItems.length === 0) {
      setError('Agrega al menos un producto a la venta.')
      return
    }

    try {
      await createSale({
        customer_id: Number(customerId),
        total,
        items: parsedItems,
      })
      setSuccess('Venta registrada correctamente.')
      setCustomerId('')
      setItems([emptyItem])
      await loadData()
    } catch (err) {
      setError(err.message || 'Error al registrar la venta')
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="page-header">
          <div>
            <h1 className="page-title">Ventas</h1>
            <p className="page-text">
              Registra ventas y revisa el historial reciente de facturación.
            </p>
          </div>
        </div>

        {loading && <div className="info-banner">Cargando ventas...</div>}
        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        <section className="section-card">
          <h2>Nueva venta</h2>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Cliente ID
              <input value={customerId} onChange={(event) => setCustomerId(event.target.value)} placeholder="Ej. 12" />
            </label>
          </form>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <select value={item.product_id} onChange={(event) => handleItemChange(index, 'product_id', event.target.value)}>
                        <option value="">Seleccionar</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input type="number" min="1" value={item.quantity} onChange={(event) => handleItemChange(index, 'quantity', event.target.value)} />
                    </td>
                    <td>
                      <input type="number" min="0" step="0.01" value={item.price} onChange={(event) => handleItemChange(index, 'price', event.target.value)} />
                    </td>
                    <td>${Number(item.subtotal || 0).toFixed(2)}</td>
                    <td>
                      <button type="button" className="button danger small" onClick={() => removeItem(index)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-actions" style={{ marginTop: '16px' }}>
            <button type="button" className="button secondary" onClick={addItem}>
              Agregar producto
            </button>
            <button type="button" className="button" onClick={handleSubmit}>
              Registrar venta
            </button>
          </div>

          <div className="page-text" style={{ marginTop: '18px' }}>
            Total venta: <strong>${total.toFixed(2)}</strong>
          </div>
        </section>

        <section className="section-card">
          <h2>Ventas recientes</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Venta</th>
                  <th>Producto ID</th>
                  <th>Cliente</th>
                  <th>Cantidad</th>
                  <th>Detalle</th>
                  <th>Total venta</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="7">No hay ventas recientes.</td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={`${sale.sale_id}-${sale.product_id}`}>
                      <td>{sale.sale_id}</td>
                      <td>{sale.product_id}</td>
                      <td>{sale.customer_id}</td>
                      <td>{sale.quantity}</td>
                      <td>{sale.product_name}</td>
                      <td>${sale.sale_total.toFixed(2)}</td>
                      <td>{sale.created_at}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Sales
