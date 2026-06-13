import { useEffect, useState } from 'react'
import {
  fetchReportsSummary,
  fetchSalesByDay,
  fetchTopProducts,
  fetchTopCustomers,
} from '../services/api.js'

function Reports() {
  const [summary, setSummary] = useState(null)
  const [salesByDay, setSalesByDay] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [topCustomers, setTopCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadReports()
  }, [])

  async function loadReports() {
    setLoading(true)
    setError('')
    try {
      const [summaryData, salesByDayData, topProductsData, topCustomersData] = await Promise.all([
        fetchReportsSummary(),
        fetchSalesByDay(10),
        fetchTopProducts(10),
        fetchTopCustomers(10),
      ])
      setSummary(summaryData)
      setSalesByDay(salesByDayData.data || [])
      setTopProducts(topProductsData.data || [])
      setTopCustomers(topCustomersData.data || [])
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los reportes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="page-header">
          <div>
            <h1 className="page-title">Reportes</h1>
            <p className="page-text">Visualiza métricas clave y tendencias de ventas.</p>
          </div>
        </div>

        {loading && <div className="info-banner">Cargando reportes...</div>}
        {error && <div className="error-banner">{error}</div>}

        {summary && (
          <div className="stats-grid">
            <article className="stat-card">
              <h2>{summary.total_ventas}</h2>
              <p>Ventas registradas</p>
            </article>
            <article className="stat-card">
              <h2>${Number(summary.ingresos_totales || 0).toFixed(2)}</h2>
              <p>Ingresos totales</p>
            </article>
          </div>
        )}

        <section className="section-card">
          <h2>Ventas por día</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Ventas</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {salesByDay.length === 0 ? (
                  <tr>
                    <td colSpan="3">No hay datos disponibles.</td>
                  </tr>
                ) : (
                  salesByDay.map((row) => (
                    <tr key={row.fecha}>
                      <td>{row.fecha}</td>
                      <td>{row.ventas}</td>
                      <td>${Number(row.total_dia || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section-card">
          <h2>Productos más vendidos</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad vendida</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan="2">No hay datos disponibles.</td>
                  </tr>
                ) : (
                  topProducts.map((item) => (
                    <tr key={item.name}>
                      <td>{item.name}</td>
                      <td>{item.cantidad_vendida}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section-card">
          <h2>Clientes top</h2>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Total comprado</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="2">No hay datos disponibles.</td>
                  </tr>
                ) : (
                  topCustomers.map((item) => (
                    <tr key={item.name}>
                      <td>{item.name}</td>
                      <td>${Number(item.total_comprado || 0).toFixed(2)}</td>
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

export default Reports
