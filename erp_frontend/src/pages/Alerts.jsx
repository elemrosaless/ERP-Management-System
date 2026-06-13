import { useEffect, useState } from 'react'
import { fetchStockAlerts } from '../services/api.js'

const STATUS_LABELS = {
  out_of_stock: 'Agotado',
  critical: 'Crítico',
  low: 'Bajo',
  ok: 'Ok',
}

function Alerts() {
  const [alerts, setAlerts] = useState({ out_of_stock: [], critical: [], low: [], ok: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAlerts()
  }, [])

  async function loadAlerts() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchStockAlerts()
      setAlerts(data)
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las alertas de stock')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="page-header">
          <div>
            <h1 className="page-title">Alertas</h1>
            <p className="page-text">Revisa productos con stock crítico o agotado.</p>
          </div>
        </div>

        {loading && <div className="info-banner">Cargando alertas...</div>}
        {error && <div className="error-banner">{error}</div>}

        {!loading && !error && (
          <div className="section-card">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <section key={key} className="alert-section">
                <h2>{label}</h2>
                {alerts[key]?.length > 0 ? (
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
                        {alerts[key].map((item) => (
                          <tr key={item.id}>
                            <td>{item.id}</td>
                            <td>{item.name}</td>
                            <td>{item.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="page-text">No hay productos en esta categoría.</p>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Alerts
