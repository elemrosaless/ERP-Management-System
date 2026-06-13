import { useEffect, useState } from 'react'
import { createSupplier, deleteSupplier, getSuppliers, updateSupplier } from '../services/api.js'

const initialForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
}

function Suppliers() {
  const [suppliers, setSupplers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    loadSuppliers()
  }, [])

  async function loadSuppliers() {
    setLoading(true)
    setError('')
    try {
      const data = await getSuppliers()
      setSupplers(data.suppliers || [])
    } catch (err) {
      setError(err.message || 'No se pudo cargar los proveedores')
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

    const supplierData = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    }

    if (!supplierData.name) {
      setError('El nombre del proveedor es obligatorio.')
      return
    }

    try {
      if (editingId) {
        await updateSupplier(editingId, supplierData)
        setSuccess('Proveedor actualizado correctamente.')
      } else {
        await createSupplier(supplierData)
        setSuccess('Proveedor creado correctamente.')
      }
      setForm(initialForm)
      setEditingId(null)
      await loadSuppliers()
    } catch (err) {
      setError(err.message || 'Error al guardar el proveedor')
    }
  }

  function handleEdit(supplier) {
    setEditingId(supplier.id)
    setForm({
      name: supplier.name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
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

  async function handleDelete(supplierId) {
    if (!window.confirm('¿Eliminar este proveedor?')) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await deleteSupplier(supplierId)
      setSuccess('Proveedor eliminado correctamente.')
      await loadSuppliers()
    } catch (err) {
      setError(err.message || 'Error al eliminar el proveedor')
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="page-header">
          <div>
            <h1 className="page-title">Proveedores</h1>
            <p className="page-text">Gestiona tu lista de proveedores.</p>
          </div>
        </div>

        {loading && (
          <div className="info-banner">Cargando proveedores...</div>
        )}
        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        <form className="section-card" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Editar Proveedor' : 'Agregar Proveedor'}</h2>
          <div className="form-grid">
            <label>
              Nombre
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                placeholder="Nombre del proveedor"
              />
            </label>

            <label>
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                placeholder="Email"
              />
            </label>

            <label>
              Teléfono
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleInputChange}
                placeholder="Teléfono"
              />
            </label>

            <label>
              Dirección
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleInputChange}
                placeholder="Dirección"
              />
            </label>
          </div>

          <div className="button-group">
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Actualizar' : 'Crear'} Proveedor
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        {suppliers.length > 0 && (
          <div className="section-card">
            <h2>Proveedores Registrados</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Dirección</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id}>
                      <td>{supplier.name}</td>
                      <td>{supplier.email}</td>
                      <td>{supplier.phone}</td>
                      <td>{supplier.address}</td>
                      <td className="actions">
                        <button
                          type="button"
                          className="btn btn-edit"
                          onClick={() => handleEdit(supplier)}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn btn-delete"
                          onClick={() => handleDelete(supplier.id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Suppliers
