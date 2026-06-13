import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Inventory from './pages/Inventory.jsx'
import Products from './pages/Products.jsx'
import Purchases from './pages/Purchases.jsx'
import Sales from './pages/Sales.jsx'
import Users from './pages/Users.jsx'
import Customers from './pages/Customers.jsx'
import Suppliers from './pages/Suppliers.jsx'
import Reports from './pages/Reports.jsx'
import Alerts from './pages/Alerts.jsx'
import NotFound from './pages/NotFound.jsx'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import './App.css'
import { clearAuthToken, getAuthToken } from './services/api.js'

function AuthenticatedLayout({ onLogout }) {
  return (
    <div className="app-shell">
      <Navbar onLogout={onLogout} />
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  )
}

function App() {
  const [authenticated, setAuthenticated] = useState(() => Boolean(getAuthToken()))

  function handleLogout() {
    clearAuthToken()
    setAuthenticated(false)
  }

  function handleLoginSuccess() {
    setAuthenticated(true)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            authenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />
        <Route index element={<Navigate to={authenticated ? '/dashboard' : '/login'} replace />} />
        <Route
          element={
            <ProtectedRoute authenticated={authenticated}>
              <AuthenticatedLayout onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
            <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/products" element={<Products />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/users" element={<Users />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/alerts" element={<Alerts />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
