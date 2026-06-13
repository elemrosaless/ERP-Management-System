import { NavLink } from 'react-router-dom'

function Navbar({ onLogout }) {
  const activeClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')

  return (
    <header className="app-header">
      <div className="top-bar">
        <div className="brand">ERP Management</div>
        <button type="button" className="logout-button" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
      <nav className="app-nav">
        <NavLink to="/dashboard" className={activeClass}>
          Dashboard
        </NavLink>
        <NavLink to="/inventory" className={activeClass}>
          Inventario
        </NavLink>
        <NavLink to="/products" className={activeClass}>
          Productos
        </NavLink>
        <NavLink to="/purchases" className={activeClass}>
          Compras
        </NavLink>
        <NavLink to="/sales" className={activeClass}>
          Ventas
        </NavLink>
        <NavLink to="/customers" className={activeClass}>
          Clientes
        </NavLink>
        <NavLink to="/suppliers" className={activeClass}>
          Proveedores
        </NavLink>
        <NavLink to="/users" className={activeClass}>
          Usuarios
        </NavLink>
        <NavLink to="/reports" className={activeClass}>
          Reportes
        </NavLink>
        <NavLink to="/alerts" className={activeClass}>
          Alertas
        </NavLink>
      </nav>
    </header>
  )
}

export default Navbar
