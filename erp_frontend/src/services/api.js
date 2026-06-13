const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    throw new Error(errorBody?.detail || 'Credenciales inválidas')
  }

  return response.json()
}

export function setAuthToken(token) {
  localStorage.setItem('erp_access_token', token)
}

export function clearAuthToken() {
  localStorage.removeItem('erp_access_token')
}

export function getAuthToken() {
  return localStorage.getItem('erp_access_token')
}

export function getAuthHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function sanitizeErrorBody(errorBody) {
  if (!errorBody) return null
  if (typeof errorBody === 'string') return errorBody
  if (errorBody.detail) {
    if (typeof errorBody.detail === 'string') return errorBody.detail
    if (Array.isArray(errorBody.detail)) return errorBody.detail[0]?.msg || JSON.stringify(errorBody.detail)
    return JSON.stringify(errorBody.detail)
  }
  if (errorBody.message) return errorBody.message
  if (Array.isArray(errorBody)) return errorBody[0]?.msg || JSON.stringify(errorBody)
  return JSON.stringify(errorBody)
}

async function handleApiError(response, defaultMessage) {
  if (response.status === 401) {
    clearAuthToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new Error('Sesión expirada, por favor inicia sesión de nuevo.')
  }

  if (!response.ok) {
    let errorBody = null
    try {
      errorBody = await response.json()
    } catch (_err) {
      // Ignore parse errors, use status text instead
    }

    const message = sanitizeErrorBody(errorBody) || `${response.status} ${response.statusText}`
    throw new Error(message || defaultMessage)
  }

  return response.json()
}

async function authorizedFetch(url, options = {}, defaultMessage = 'Error en la petición') {
  let lastError = null

  try {
    const headers = {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    }

    if (options.body != null) {
      headers['Content-Type'] = 'application/json'
    }

    console.log(`[API] Intentando ${options.method || 'GET'} ${url}`)

    const response = await fetch(url, {
      ...options,
      headers,
    })

    return await handleApiError(response, defaultMessage)
  } catch (err) {
    console.error(`[API] Error en ${url}:`, err.message, { url, method: options.method, headers: options.headers })
    lastError = err

    // Si es TypeError "Failed to fetch", dar más contexto
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(`No se pudo conectar con ${url}. Asegúrate de que el backend está activo en esa dirección.`)
    }

    throw new Error(err.message || `No se pudo conectar con el servidor (${defaultMessage}).`)
  }

  throw lastError || new Error('No se pudo conectar con el servidor.')
}

export async function fetchDashboardSummary() {
  return authorizedFetch(`${API_BASE_URL}/dashboard/`, {}, 'No se pudo cargar el dashboard')
}

export async function fetchLowStock(threshold = 10) {
  return authorizedFetch(
    `${API_BASE_URL}/dashboard/low-stock?threshold=${threshold}`,
    {},
    'No se pudo obtener productos con bajo stock'
  )
}

export async function getProducts(limit = 100) {
  return authorizedFetch(
    `${API_BASE_URL}/products?limit=${limit}`,
    {},
    'No se pudo cargar los productos'
  )
}

export async function getSuppliers() {
  return authorizedFetch(
    `${API_BASE_URL}/suppliers`,
    {},
    'No se pudo cargar los proveedores'
  )
}

export async function createProduct(product) {
  return authorizedFetch(
    `${API_BASE_URL}/products`,
    {
      method: 'POST',
      body: JSON.stringify(product),
    },
    'No se pudo crear el producto'
  )
}

export async function updateProduct(productId, product) {
  return authorizedFetch(
    `${API_BASE_URL}/products/${productId}`,
    {
      method: 'PUT',
      body: JSON.stringify(product),
    },
    'No se pudo actualizar el producto'
  )
}

export async function deleteProduct(productId) {
  return authorizedFetch(
    `${API_BASE_URL}/products/${productId}`,
    {
      method: 'DELETE',
    },
    'No se pudo eliminar el producto'
  )
}

export async function createPurchase(purchase) {
  return authorizedFetch(
    `${API_BASE_URL}/purchases`,
    {
      method: 'POST',
      body: JSON.stringify(purchase),
    },
    'No se pudo registrar la compra'
  )
}

export async function getInventoryMovements() {
  return authorizedFetch(
    `${API_BASE_URL}/inventory/movements`,
    {},
    'No se pudo cargar el inventario'
  )
}

export async function createInventoryMovement(movement) {
  const params = new URLSearchParams({
    product_id: movement.product_id,
    movement_type: movement.movement_type,
    quantity: movement.quantity,
  })
  return authorizedFetch(
    `${API_BASE_URL}/inventory/movements?${params.toString()}`,
    {
      method: 'POST',
    },
    'No se pudo registrar el movimiento'
  )
}

export async function fetchRecentSales(limit = 10) {
  return authorizedFetch(
    `${API_BASE_URL}/dashboard/recent-sales?limit=${limit}`,
    {},
    'No se pudo cargar las ventas recientes'
  )
}

export async function createSale(sale) {
  return authorizedFetch(
    `${API_BASE_URL}/sales/`,
    {
      method: 'POST',
      body: JSON.stringify(sale),
    },
    'No se pudo registrar la venta'
  )
}

export async function getUsers(limit = 100) {
  return authorizedFetch(
    `${API_BASE_URL}/users/?limit=${limit}`,
    {},
    'No se pudo cargar los usuarios'
  )
}

export async function createUser(user) {
  return authorizedFetch(
    `${API_BASE_URL}/users/`,
    {
      method: 'POST',
      body: JSON.stringify(user),
    },
    'No se pudo crear el usuario'
  )

}

export async function updateUser(userId, user) {
  return authorizedFetch(
    `${API_BASE_URL}/users/${userId}`,
    {
      method: 'PUT',
      body: JSON.stringify(user),
    },
    'No se pudo actualizar el usuario'
  )
}

export async function deleteUser(userId) {
  return authorizedFetch(
    `${API_BASE_URL}/users/${userId}`,
    {
      method: 'DELETE',
    },
    'No se pudo eliminar el usuario'
  )
}

export async function fetchCustomers() {
  return authorizedFetch(
    `${API_BASE_URL}/customers`,
    {},
    'No se pudo cargar los clientes'
  )
}

export async function createCustomer(customer) {
  return authorizedFetch(
    `${API_BASE_URL}/customers`,
    {
      method: 'POST',
      body: JSON.stringify(customer),
    },
    'No se pudo crear el cliente'
  )
}

export async function updateCustomer(customerId, customer) {
  return authorizedFetch(
    `${API_BASE_URL}/customers/${customerId}`,
    {
      method: 'PUT',
      body: JSON.stringify(customer),
    },
    'No se pudo actualizar el cliente'
  )
}

export async function deleteCustomer(customerId) {
  return authorizedFetch(
    `${API_BASE_URL}/customers/${customerId}`,
    {
      method: 'DELETE',
    },
    'No se pudo eliminar el cliente'
  )
}

export async function createSupplier(supplier) {
  return authorizedFetch(
    `${API_BASE_URL}/suppliers`,
    {
      method: 'POST',
      body: JSON.stringify(supplier),
    },
    'No se pudo crear el proveedor'
  )
}

export async function updateSupplier(supplierId, supplier) {
  return authorizedFetch(
    `${API_BASE_URL}/suppliers/${supplierId}`,
    {
      method: 'PUT',
      body: JSON.stringify(supplier),
    },
    'No se pudo actualizar el proveedor'
  )
}

export async function deleteSupplier(supplierId) {
  return authorizedFetch(
    `${API_BASE_URL}/suppliers/${supplierId}`,
    {
      method: 'DELETE',
    },
    'No se pudo eliminar el proveedor'
  )
}

export async function fetchReportsSummary() {
  return authorizedFetch(
    `${API_BASE_URL}/reports/summary`,
    {},
    'No se pudo cargar el resumen de reportes'
  )
}

export async function fetchSalesByDay(limit = 10) {
  return authorizedFetch(
    `${API_BASE_URL}/reports/sales-by-day?limit=${limit}`,
    {},
    'No se pudo cargar ventas por día'
  )
}

export async function fetchTopProducts(limit = 10) {
  return authorizedFetch(
    `${API_BASE_URL}/reports/top-products?limit=${limit}`,
    {},
    'No se pudo cargar los productos más vendidos'
  )
}

export async function fetchTopCustomers(limit = 10) {
  return authorizedFetch(
    `${API_BASE_URL}/reports/top-customers?limit=${limit}`,
    {},
    'No se pudo cargar los clientes top'
  )
}

export async function fetchStockAlerts() {
  return authorizedFetch(
    `${API_BASE_URL}/alerts/stock`,
    {},
    'No se pudieron cargar las alertas de stock'
  )
}

export async function fetchRecentPurchases(limit = 10) {
  return authorizedFetch(
    `${API_BASE_URL}/purchases?limit=${limit}`,
    {},
    'No se pudo cargar el historial de compras'
  )
}
