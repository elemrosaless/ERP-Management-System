import { useEffect, useState } from 'react'
import { createCustomer, deleteCustomer, fetchCustomers, updateCustomer } from '../services/api.js'

const initialForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
}

function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchCustomers()
      setCustomers(data.customers || [])
    } catch (err) {
      setError(err.message || 'No se pudo cargar los clientes')
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

    const customerData = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    }

    if (!customerData.name) {
      setError('El nombre del cliente es obligatorio.')
      return
    }

    try {
      if (editingId) {
        await updateCustomer(editingId, customerData)
        setSuccess('Cliente actualizado correctamente.')
      } else {
        await createCustomer(customerData)
        setSuccess('Cliente creado correctamente.')
      }
      setForm(initialForm)
      setEditingId(null)
      await loadCustomers()
    } catch (err) {
      setError(err.message || 'Error al guardar el cliente')
    }
  }

  function handleEdit(customer) {
    setEditingId(customer.id)
    setForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
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

  async function handleDelete(customerId) {
    if (!window.confirm('¿Eliminar este cliente?')) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await deleteCustomer(customerId)
      setSuccess('Cliente eliminado correctamente.')
      await loadCustomers()
    } catch (err) {
      setError(err.message || 'Error al eliminar el cliente')
    }
  }

  const formTitle = editingId ? 'Editar cliente' : 'Nuevo cliente'

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="page-header">
          <div>
            <h1 className="page-title">Clientes</h1>
            <p className="page-text">Gestiona los clientes registrados del ERP.</p>
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
              Email
              <input name="email" value={form.email} onChange={handleInputChange} />
            </label>
            <label>
              Teléfono
              <input name="phone" value={form.phone} onChange={handleInputChange} />
            </label>
            <label>
              Dirección
              <input name="address" value={form.address} onChange={handleInputChange} />
            </label>
            <div className="form-actions">
              <button type="submit" className="button">
                {editingId ? 'Actualizar' : 'Crear'}
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
          <h2>Lista de clientes</h2>
          {loading ? (
            <div className="info-banner">Cargando clientes...</div>
          ) : error ? (
            <div className="error-banner">{error}</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Dirección</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan="5">No hay clientes registrados.</td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr key={customer.id}>
                        <td>{customer.id}</td>
                        <td>{customer.name}</td>
                        <td>{customer.email}</td>
                        <td>{customer.phone}</td>
                        <td>{customer.address || '-'}</td>
                        <td className="row-actions">
                          <button type="button" className="button secondary small" onClick={() => handleEdit(customer)}>
                            Editar
                          </button>
                          <button type="button" className="button danger small" onClick={() => handleDelete(customer.id)}>
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Customers
