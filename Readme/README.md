# ERP Management System | FastAPI + React + PostgreSQL + Power BI

## Descripción

Sistema de gestión empresarial completo con módulos de ventas, compras, inventario, usuarios y reportes. Backend en Python/FastAPI con frontend React, base de datos PostgreSQL e integración con Power BI para análisis.

## Resumen técnico

- API REST desarrollada con FastAPI
- Base de datos PostgreSQL
- 10+ tablas relacionadas
- Autenticación JWT
- Frontend SPA en React
- Reportes con Power BI
- Migraciones con Alembic

## Capturas de pantalla

- [Login (con JWT)](image.png)
- [Dashboard (KPIs, ingresos diarios, stock bajo)](image-1.png)
- [Inventario (movimientos de stock)](image-2.png)
- [Productos (CRUD, control de stock)](image-3.png)
- [Ventas (registro de ventas con detalle de productos)](image-5.png)
- [Compras (registro de compras por proveedor)](image-4.png)
- [Usuarios (gestión de usuarios y roles)](image-6.png)
- [Clientes ](image-7.png)
- [Proveedores](image-8.png)
- [- Reportes (ventas por día, productos top, clientes top)](image-9.png)[](image-10.png)
- [Alertas (notificaciones de stock bajo)](image-11.png)
-

## Tecnologías

- **Backend:** Python, FastAPI, SQLAlchemy, Alembic
- **Frontend:** React, Vite, React Router
- **Base de datos:** PostgreSQL
- **Autenticación:** JWT
- **Reportes:** Power BI
- **Control de versiones:** Git/GitHub

## Funcionalidades

- ✅ Login y roles (admin/usuario)
- ✅ Gestión de usuarios (crear, editar, eliminar - soft delete)
- ✅ Catálogo de productos (CRUD, control de stock)
- ✅ Gestión de clientes
- ✅ Gestión de proveedores
- ✅ Registro de compras (actualiza stock automáticamente)
- ✅ Registro de ventas (descuenta stock, valida disponibilidad)
- ✅ Control de inventario (movimientos IN/OUT)
- ✅ Dashboard con KPIs (ventas hoy, usuarios, productos, ingresos)
- ✅ Reportes (ventas por día, productos más vendidos, clientes top, ingresos mensuales)
- ✅ Alertas de stock bajo
- ✅ Vistas SQL para Power BI
- ✅ Soft delete (eliminación lógica, no física)

## Arquitectura

```
React (Puerto 5173)
    ↓
FastAPI (Puerto 8000)
    ↓
PostgreSQL (Puerto 5433)
    ↓
Power BI (análisis y reportes)
```

## Instalación

### Backend

```bash
cd erp_backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd erp_frontend
npm install
npm run dev
```

## Swagger

Documenta automáticamente todos los endpoints REST:

```
http://localhost:8000/docs

```

## Características destacadas

- Arquitectura cliente-servidor
- Autenticación basada en JWT
- Control de acceso por roles
- Gestión de inventario en tiempo real
- Soft delete para preservar historial
- Integración de Business Intelligence con Power BI
- API documentada con Swagger/OpenAPI

## Aprendizajes

Durante el desarrollo de este proyecto trabajé con:

- Diseño de APIs REST con FastAPI
- Autenticación y autorización mediante JWT
- Diseño y modelado de bases de datos relacionales
- Gestión de migraciones con Alembic
- Integración entre frontend (React) y backend (FastAPI)
- Implementación de lógica de negocio para inventario, compras y ventas
- Manejo de transacciones y consistencia de datos
- Generación de reportes y visualización de datos con Power BI

## Próximas mejoras

- 🔲 Dockerizar (Docker + docker-compose)
- 🔲 Tests automatizados (pytest, vitest)
- 🔲 Exportar reportes (Excel, PDF)
- 🔲 Deploy en AWS o Azure
- 🔲 Autenticación OAuth2
- 🔲 Caché Redis
- 🔲 Notificaciones en tiempo real (WebSockets)
- 🔲 Auditoría completa de cambios
