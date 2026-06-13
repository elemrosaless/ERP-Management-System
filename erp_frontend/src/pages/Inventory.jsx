import { useEffect, useState } from 'react'
import { createInventoryMovement, getInventoryMovements, getProducts } from '../services/api.js'

const initialMovement = {
  product_id: '',
  movement_type: 'IN',
  quantity: '1',
}

function Inventory() {
  const [products, setProducts] = useState([])
  const [movements, setMovements] = useState([])
  const [movement, setMovement] = useState(initialMovement)
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
      const [productsData, movementsData] = await Promise.all([
        getProducts(100),
        getInventoryMovements(),
      ])
      setProducts(productsData.products || [])
      setMovements(movementsData.movements || [])
    } catch (err) {
      setError(err.message || 'Error al cargar inventario')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setMovement((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!movement.product_id || !movement.quantity) {
      setError('Selecciona producto y cantidad.')
      return
    }

    try {
      await createInventoryMovement({
        product_id: Number(movement.product_id),
        movement_type: movement.movement_type,
        quantity: Number(movement.quantity),
      })
      setSuccess('Movimiento registrado correctamente.')
      setMovement(initialMovement)
      await loadData()
    } catch (err) {
      setError(err.message || 'Error al registrar movimiento')
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="page-header">
          <div>
            <h1 className="page-title">Inventario</h1>
            <p className="page-text">
              Registra movimientos de stock y revisa el historial reciente.
            </p>
          </div>
        </div>

        {loading && <div className="info-banner">Cargando inventario...</div>}
        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        <section className="section-card">
          <h2>Nuevo movimiento</h2>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              Producto
              <select name="product_id" value={movement.product_id} onChange={handleChange}>
                <option value="">Selecciona producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo
              <select name="movement_type" value={movement.movement_type} onChange={handleChange}>
                <option value="IN">Entrada</option>
                <option value="OUT">Salida</option>
              </select>
            </label>
            <label>
              Cantidad
              <input
                name="quantity"
                type="number"
                min="1"
                value={movement.quantity}
                onChange={handleChange}
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="button">
                Registrar movimiento
              </button>
            </div>
          </form>
        </section>

        <section className="section-card">
          <h2>Historial de movimientos</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((item) => (
                  <tr key={item.id || `${item.product_id}-${item.created_at}`}>
                    <td>{item.id || '-'}</td>
                    <td>{item.product_id}</td>
                    <td>{item.movement_type}</td>
                    <td>{item.quantity}</td>
                    <td>{item.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Inventory
