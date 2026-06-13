import { useEffect, useState } from 'react'
import { fetchDashboardSummary, fetchLowStock } from '../services/api.js'

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true)
      setError('')

      try {
        const [summaryData, lowStockData] = await Promise.all([
          fetchDashboardSummary(),
          fetchLowStock(),
        ])
        setSummary(summaryData)
        setLowStock(lowStockData.low_stock || [])
      } catch (err) {
        setError(err.message || 'Error al cargar el dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="page-header">
          <h1 className="page-title">Panel de control</h1>
          <p className="page-text">Resumen rápido del estado del ERP.</p>
        </div>

        {loading && <div className="info-banner">Cargando datos...</div>}
        {error && <div className="error-banner">{error}</div>}

        {summary && (
          <div className="stats-grid">
            <article className="stat-card">
              <h2>{summary.total_users}</h2>
              <p>Usuarios activos</p>
            </article>
            <article className="stat-card">
              <h2>{summary.total_products}</h2>
              <p>Productos activos</p>
            </article>
            <article className="stat-card">
              <h2>{summary.sales_today}</h2>
              <p>Ventas hoy</p>
            </article>
            <article className="stat-card">
              <h2>${summary.revenue_today.toFixed(2)}</h2>
              <p>Ingreso hoy</p>
            </article>
          </div>
        )}

        <section className="section-card">
          <h2>Productos con stock bajo</h2>
          {lowStock.length === 0 ? (
            <p className="page-text">No hay productos con stock bajo por ahora.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.name}</td>
                      <td>{product.stock}</td>
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

export default Dashboard
