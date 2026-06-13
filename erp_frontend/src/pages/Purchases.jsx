import { useEffect, useMemo, useState } from 'react'
import { createPurchase, getProducts, getSuppliers, fetchRecentPurchases } from '../services/api.js'

const emptyItem = {
  product_id: '',
  quantity: '1',
  price: '0',
  subtotal: '0',
}

function Purchases() {
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [supplierId, setSupplierId] = useState('')
  const [items, setItems] = useState([emptyItem])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [recentPurchases, setRecentPurchases] = useState([])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const [productResponse, supplierResponse, purchasesResponse] = await Promise.all([
          getProducts(100),
          getSuppliers(),
          fetchRecentPurchases(50),
        ])

        setProducts(productResponse.products || [])
        setSuppliers(supplierResponse.suppliers || [])
        setRecentPurchases(purchasesResponse.purchases || [])
      } catch (err) {
        setError(err.message || 'No se pudo cargar los datos')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0),
    [items]
  )

  function updateRow(index, changes) {
    setItems((current) =>
      current.map((item, idx) => {
        if (idx !== index) return item
        return { ...item, ...changes }
      })
    )
  }

  function handleItemChange(index, field, value) {
    const item = items[index]
    const updated = { ...item, [field]: value }

    if (field === 'product_id') {
      const selected = products.find(
        (prod) => String(prod.id) === String(value)
      )
      updated.price = selected ? String(selected.price) : '0'
    }

    if (field === 'quantity' || field === 'price') {
      const quantity = Number(updated.quantity || 0)
      const price = Number(updated.price || 0)
      updated.subtotal = (quantity * price).toFixed(2)
    }

    updateRow(index, updated)
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

    if (!supplierId) {
      setError('Selecciona un proveedor antes de registrar la compra.')
      return
    }

    const parsedItems = items
      .filter((item) => item.product_id)
      .map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
        cost: Number(item.price),
        subtotal: Number(item.subtotal),
      }))

    if (parsedItems.length === 0) {
      setError('Agrega al menos un producto a la compra.')
      return
    }

    try {
      await createPurchase({
        supplier_id: Number(supplierId),
        total,
        items: parsedItems,
      })

      setSuccess('Compra registrada correctamente.')
      setItems([emptyItem])
      setSupplierId('')
      
      // Recargar el historial de compras
      const purchasesResponse = await fetchRecentPurchases(50)
      setRecentPurchases(purchasesResponse.purchases || [])
    } catch (err) {
      setError(err.message || 'Error al registrar la compra')
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="page-header">
          <div>
            <h1 className="page-title">Compras</h1>
            <p className="page-text">
              Registra compras y actualiza el stock automáticamente.
            </p>
          </div>
        </div>

        {loading && (
          <div className="info-banner">
            Cargando productos y proveedores para la compra...
          </div>
        )}
        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        <form className="section-card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Proveedor
              <select
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
              >
                <option value="">Seleccionar proveedor</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

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
                      <select
                        value={item.product_id}
                        onChange={(event) =>
                          handleItemChange(index, 'product_id', event.target.value)
                        }
                      >
                        <option value="">Seleccionar producto</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) =>
                          handleItemChange(index, 'quantity', event.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(event) =>
                          handleItemChange(index, 'price', event.target.value)
                        }
                      />
                    </td>

                    <td>${Number(item.subtotal || 0).toFixed(2)}</td>

                    <td>
                      <button
                        type="button"
                        className="button danger small"
                        onClick={() => removeItem(index)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="button" className="button secondary" onClick={addItem}>
            Agregar producto
          </button>

          <div className="page-text" style={{ marginTop: '16px' }}>
            Total: <strong>${total.toFixed(2)}</strong>
          </div>

          <div className="form-actions" style={{ marginTop: '24px' }}>
            <button type="submit" className="button">
              Registrar compra
            </button>
          </div>
        </form>

        <div className="dashboard-card" style={{ marginTop: '32px' }}>
          <div className="page-header">
            <div>
              <h2 className="page-title">Historial de compras</h2>
              <p className="page-text">Últimas compras registradas</p>
            </div>
          </div>

          {recentPurchases.length === 0 ? (
            <div className="info-banner">Sin compras registradas aún</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Compra ID</th>
                    <th>Proveedor</th>
                    <th>Producto ID</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio unitario</th>
                    <th>Subtotal</th>
                    <th>Total compra</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPurchases.map((purchase, idx) => (
                    <tr key={idx}>
                      <td>{purchase.purchase_id}</td>
                      <td>{purchase.supplier_name}</td>
                      <td>{purchase.product_id}</td>
                      <td>{purchase.product_name}</td>
                      <td>{purchase.quantity}</td>
                      <td>${Number(purchase.unit_cost || 0).toFixed(2)}</td>
                      <td>${Number(purchase.subtotal || 0).toFixed(2)}</td>
                      <td className="table-highlight">${Number(purchase.purchase_total || 0).toFixed(2)}</td>
                      <td>
                        {purchase.created_at
                          ? new Date(purchase.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Purchases