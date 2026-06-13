import { useEffect, useState } from 'react'
import { createUser, deleteUser, getUsers, updateUser } from '../services/api.js'

const initialForm = {
  name: '',
  email: '',
  password: '',
}

function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    setError('')
    try {
      const data = await getUsers(100)
      setUsers(data.users || [])
    } catch (err) {
      setError(err.message || 'No se pudo cargar la lista de usuarios')
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

  const userData = {
    name: form.name.trim(),
    email: form.email.trim(),
    password: form.password.trim(),
  }

  if (!userData.name || !userData.email) {
    setError('Completa nombre y email.')
    return
  }

  if (!editingId && !userData.password) {
    setError('La contraseña es obligatoria para un nuevo usuario.')
    return
  }

  try {
    if (editingId) {
      // si no quieres cambiar password, lo quitamos
      if (!userData.password) {
        delete userData.password
      }

      await updateUser(editingId, userData)
      setSuccess('Usuario actualizado correctamente.')
    } else {
      await createUser(userData)
      setSuccess('Usuario creado correctamente.')
    }

    setForm(initialForm)
    setEditingId(null)
    await loadUsers()

  } catch (err) {
    console.log(err)
    setError(err.detail || err.message || 'Error al guardar el usuario')
  }
}
  function handleEdit(user) {
    setEditingId(user.id)
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
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

  async function handleDelete(userId) {
    if (!window.confirm('¿Eliminar este usuario?')) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await deleteUser(userId)
      setSuccess('Usuario eliminado correctamente.')
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Error al eliminar el usuario')
    }
  }

  const formTitle = editingId ? 'Editar usuario' : 'Nuevo usuario'

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <div className="page-header">
          <div>
            <h1 className="page-title">Usuarios</h1>
            <p className="page-text">Administra el acceso de usuarios al sistema.</p>
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
              Contraseña
              <input name="password" type="password" value={form.password} onChange={handleInputChange} />
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
          <h2>Lista de usuarios</h2>
          {loading ? (
            <div className="info-banner">Cargando usuarios...</div>
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
                    <th>Rol</th>
                    <th>Activo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6">No hay usuarios registrados.</td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{user.is_active ? 'Sí' : 'No'}</td>
                        <td className="row-actions">
                          <button type="button" className="button secondary small" onClick={() => handleEdit(user)}>
                            Editar
                          </button>
                          <button type="button" className="button danger small" onClick={() => handleDelete(user.id)}>
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

export default Users
