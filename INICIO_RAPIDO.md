# 🚀 Inicio Rápido - Cableworld Dashboard

## Instalación Rápida (5 minutos)

### 1. Instalar dependencias
```powershell
cd backend
npm install
```

### 2. Crear base de datos
```powershell
mysql -u root -p cableworld_dashboard < init-db.sql
```

### 3. Configurar .env
Crea `backend/.env`:
```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=cableworld_dashboard
JWT_SECRET=minimo32caracteresdecontraseñasegura
JWT_EXPIRY=24h
SESSION_SECRET=otra_contraseña_aleatoria_32chars
```

### 4. Iniciar servidor
```powershell
cd backend
npm start
```

### 5. Acceder
```
http://localhost:3000
Usuario: admin
(Sin contraseña en primer acceso)
```

---

## Control de Permisos del Botón "Nuevo Manual"

### El botón aparece SOLO si:
✅ El usuario tiene el permiso `create_manuals`

### Cómo asignar el permiso:

1. **Inicia sesión como admin**
2. **Ve a**: Ajustes ⚙️ → Gestión de Usuarios
3. **Tab "Roles"** → Crea o edita un rol
4. **Marca**: `☑️ create_manuals` (Crear manuales)
5. **Asigna el rol** a un usuario en el Tab "Usuarios"

### Verificar que funciona:
```powershell
# En la consola del navegador (F12):
STATE.authUser.permissions  # Debería incluir "create_manuals"
```

---

## Comandos Útiles

```powershell
# Iniciar
cd backend && npm start

# Detener todos los procesos Node
Get-Process node | Stop-Process -Force

# Ver estado de MySQL
net start MySQL80
net stop MySQL80

# Resetear base de datos
mysql -u root -p cableworld_dashboard < init-db.sql

# Crear respaldo BD
mysqldump -u root -p cableworld_dashboard > backup.sql

# Ver logs en tiempo real
npm start

# Ver puerto 3000 en uso
netstat -ano | findstr ":3000"
```

---

## Estructura de Carpetas

```
call-center/
├── backend/
│   ├── public/
│   │   ├── html/index.html       ← Página principal
│   │   ├── js/app.js             ← Lógica principal
│   │   └── css/                  ← Estilos
│   ├── server.js                 ← Servidor Express
│   ├── init-db.sql               ← Schema BD
│   ├── .env                      ← Config (crear)
│   └── package.json
├── INSTALACION_Y_CONFIGURACION.md ← Guía completa
└── README.md                     ← Descripción general
```

---

## Permisos Disponibles

### Manuales
- `view_manuals` - Ver manuales
- `create_manuals` - **← Necesario para botón "Nuevo Manual"**
- `edit_manuals` - Editar propios
- `edit_all_manuals` - Editar todos
- `delete_manuals` - Eliminar propios
- `delete_all_manuals` - Eliminar todos

### Diagramas
- `view_diagrams` - Ver diagramas
- `create_diagrams` - Crear diagramas
- `edit_diagrams` - Editar propios
- `edit_all_diagrams` - Editar todos
- `delete_diagrams` - Eliminar propios
- `delete_all_diagrams` - Eliminar todos

### Admin
- `view_users` - Ver usuarios
- `create_users` - Crear usuarios
- `manage_roles` - Gestionar roles
- `manage_kb` - Knowledge Base Manager
- `view_audit` - Ver auditoría

---

## Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| "Module not found" | `npm install` en backend |
| "Connection refused 3306" | Iniciar MySQL: `net start MySQL80` |
| Puerto 3000 ocupado | Cambiar en .env o: `taskkill /PID xxxxx /F` |
| BD no existe | `mysql -u root -p cableworld_dashboard < init-db.sql` |
| Botón no aparece | Usuario sin permiso `create_manuals` |
| No hay usuarios | Crear admin en BD o en primer login |

---

**Documentación completa**: Ver `INSTALACION_Y_CONFIGURACION.md`
