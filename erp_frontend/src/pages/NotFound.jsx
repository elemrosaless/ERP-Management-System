import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <h1>Página no encontrada</h1>
        <p className="page-text">
          La página que buscas no existe. Regresa al panel de control usando el enlace a continuación.
        </p>
        <Link to="/dashboard" className="button">
          Volver al dashboard
        </Link>
      </div>
    </div>
  )
}

export default NotFound
