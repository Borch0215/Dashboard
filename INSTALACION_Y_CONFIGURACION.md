# 📋 Guía de Instalación y Configuración - Cableworld Dashboard

## 📌 Tabla de Contenidos
1. [Requisitos Previos](#requisitos-previos)
2. [Instalación](#instalación)
3. [Configuración Inicial](#configuración-inicial)
4. [Gestión de Usuarios y Roles](#gestión-de-usuarios-y-roles)
5. [Estructura de Permisos](#estructura-de-permisos)
6. [Ejecutar la Aplicación](#ejecutar-la-aplicación)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Requisitos Previos

### Software Necesario
- **Node.js** v16 o superior ([Descargar](https://nodejs.org/))
- **npm** v7 o superior (incluido con Node.js)
- **MySQL** v5.7 o superior ([Descargar](https://www.mysql.com/downloads/))
- **Git** (opcional, para clonar el repositorio)

### Verificar Instalación
```powershell
node --version      # Debería mostrar v16+
npm --version       # Debería mostrar v7+
mysql --version     # Debería mostrar v5.7+
```

---

## 💻 Instalación

### Paso 1: Obtener los Archivos
```powershell
# Opción A: Si tienes Git
git clone <tu-repositorio>
cd call-center

# Opción B: Si descargaste manualmente
# Extrae el archivo ZIP y abre PowerShell en la carpeta
cd call-center
```

### Paso 2: Instalar Dependencias del Backend
```powershell
cd backend
npm install
```

### Paso 3: Crear la Base de Datos
```powershell
# Abre MySQL
mysql -u root -p

# Una vez dentro de MySQL, copia y pega esto:
CREATE DATABASE cableworld_dashboard;
USE cableworld_dashboard;

# Importa el archivo SQL de inicialización:
SOURCE init-db.sql;

EXIT;
```

**Si prefieres hacerlo desde PowerShell:**
```powershell
mysql -u root -p cableworld_dashboard < init-db.sql
```

### Paso 4: Configurar Variables de Entorno
Crea un archivo `.env` en la carpeta `backend`:

```
# .env
NODE_ENV=development
PORT=3000

# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=cableworld_dashboard
DB_PORT=3306

# Seguridad
JWT_SECRET=tu_clave_secreta_aqui_minimo_32_caracteres
JWT_EXPIRY=24h

# Session
SESSION_SECRET=otra_clave_secreta_diferente_minimo_32
COOKIE_SECURE=false
```

⚠️ **Importante**: En producción, usa claves aleatorias fuertes. Ejemplo:
```powershell
# En PowerShell para generar una clave aleatoria
[Convert]::ToBase64String((1..32 | ForEach-Object {[byte](Get-Random -Maximum 256)}))
```

---

## ⚙️ Configuración Inicial

### 1. Crear Usuario Administrador
El sistema se inicializa sin usuarios. Para crear el primer admin:

**Opción A: Directamente en MySQL**
```sql
USE cableworld_dashboard;

INSERT INTO users (username, email, password_hash, role, full_name, created_at) 
VALUES ('admin', 'admin@cableworld.com', SHA2('admin123', 256), 'admin', 'Administrador', NOW());
```

**Opción B: Mediante el formulario de login**
1. Inicia la aplicación (ver sección Ejecutar)
2. En el login, usa: `usuario: admin` (sin contraseña)
3. Te pedirá configurar contraseña en el primer acceso
4. Establece una contraseña segura

### 2. Acceder al Dashboard
```
URL: http://localhost:3000
Usuario: admin
Contraseña: (la que configuraste)
```

### 3. Ir a Ajustes → Gestión de Usuarios
Desde aquí puedes:
- Crear nuevos usuarios
- Asignar roles
- Gestionar permisos
- Activar/desactivar usuarios

---

## 👥 Gestión de Usuarios y Roles

### Crear un Nuevo Usuario

1. **Navega a**: Ajustes (⚙️) → Gestión de Usuarios → Tab "Usuarios"
2. **Rellena los datos**:
   - Nombre de usuario: `jrodriguez`
   - Nombre completo: `Juan Rodríguez`
   - Email: `jrodriguez@cableworld.com`
   - Selecciona uno o más roles
3. **Haz clic en**: "Crear Usuario"
4. El usuario recibirá un email para configurar su contraseña

### Crear un Rol Personalizado

1. **Navega a**: Ajustes (⚙️) → Gestión de Usuarios → Tab "Roles"
2. **Rellena los datos**:
   - Nombre del rol: `Editor de Manuales`
   - Descripción: `Puede crear, editar y eliminar manuales propios`
3. **Selecciona permisos** (marca las casillas):
   - ✅ `view_manuals` - Ver manuales
   - ✅ `create_manuals` - Crear manuales
   - ✅ `edit_manuals` - Editar manuales propios
   - ✅ `delete_manuals` - Eliminar manuales propios
4. **Haz clic en**: "Crear Rol"

### Editar Permisos de un Usuario

1. En la tabla de usuarios, haz clic en el usuario
2. Modifica los roles asignados
3. Haz clic en "Guardar cambios"

---

## 🔐 Estructura de Permisos

### Permisos de Manuales
| Permiso | Descripción | Impacto |
|---------|-------------|---------|
| `view_manuals` | Ver manuales | Muestra la pestaña "Manuales" |
| `create_manuals` | Crear nuevos manuales | Muestra el botón "Nuevo Manual" |
| `edit_manuals` | Editar manuales propios | Permite editar solo sus manuales |
| `edit_all_manuals` | Editar todos los manuales | Puede editar manuales de otros |
| `delete_manuals` | Eliminar manuales propios | Puede eliminar solo sus manuales |
| `delete_all_manuals` | Eliminar todos los manuales | Puede eliminar cualquier manual |

### Permisos de Diagramas
| Permiso | Descripción |
|---------|-------------|
| `view_diagrams` | Ver árboles de decisión |
| `create_diagrams` | Crear nuevos árboles |
| `edit_diagrams` | Editar árboles propios |
| `edit_all_diagrams` | Editar todos los árboles |
| `delete_diagrams` | Eliminar árboles propios |
| `delete_all_diagrams` | Eliminar todos los árboles |

### Permisos de Administración
| Permiso | Descripción |
|---------|-------------|
| `view_users` | Ver lista de usuarios |
| `create_users` | Crear nuevos usuarios |
| `edit_users` | Editar usuarios |
| `delete_users` | Eliminar usuarios |
| `manage_roles` | Crear y editar roles |
| `manage_specialties` | Gestionar especialidades |
| `manage_folders` | Gestionar carpetas KB |
| `manage_kb` | Acceso a Knowledge Base Manager |
| `view_audit` | Ver registro de auditoría |
| `export_audit` | Exportar datos de auditoría |

---

## 🚀 Ejecutar la Aplicación

### Opción 1: Iniciar Backend Solamente
```powershell
cd backend
npm start
```
- Backend corre en: `http://localhost:3000`
- Frontend será servido desde el backend

### Opción 2: Usar Scripts de Inicio (Windows)
```powershell
# Iniciar todos los servidores
.\iniciar-servidores.bat

# Detener todos los servidores
.\detener-servidores.bat

# Reiniciar todos los servidores
.\reiniciar-servidores.bat
```

### Opción 3: Desarrollo con npm en PowerShell
```powershell
cd backend
npm start

# En otra ventana de PowerShell, desde la raíz:
# (El frontend se sirve automáticamente)
```

---

## 🌐 Acceder al Dashboard

### Localmente
```
http://localhost:3000
```

### En Red (desde otra computadora)
```
http://IP_DEL_SERVIDOR:3000
http://192.168.1.100:3000  (ejemplo)
```

**Para encontrar tu IP:**
```powershell
ipconfig
# Busca "IPv4 Address" bajo "Ethernet" o "Wi-Fi"
```

---

## 📁 Estructura del Proyecto

```
call-center/
├── backend/
│   ├── public/
│   │   ├── css/              # Estilos
│   │   ├── html/
│   │   │   └── index.html    # Página principal
│   │   └── js/               # Scripts frontend
│   ├── init-db.sql           # Inicialización de BD
│   ├── server.js             # Servidor principal
│   ├── package.json
│   └── .env                  # Variables de entorno (crea este)
├── INSTALACION_Y_CONFIGURACION.md  # Este archivo
├── iniciar-servidores.bat
├── detener-servidores.bat
└── reiniciar-servidores.bat
```

---

## 🔍 Troubleshooting

### Error: "Cannot find module 'express'"
**Solución:**
```powershell
cd backend
npm install
npm start
```

### Error: "ECONNREFUSED 127.0.0.1:3306"
**Significa:** MySQL no está corriendo
**Solución:**
```powershell
# Windows: asegúrate que MySQL esté iniciado
# En Services (services.msc) busca "MySQL80" y da Start
# O desde línea de comandos:
net start MySQL80
```

### Error: "ER_ACCESS_DENIED_FOR_USER 'root'@'localhost'"
**Significa:** Contraseña de MySQL incorrecta en .env
**Solución:**
```
1. Verifica la contraseña en el archivo .env
2. Prueba conectarte directamente:
   mysql -u root -p
3. Si no recuerdas la contraseña, resetéala en MySQL
```

### Error: "table users doesn't exist"
**Significa:** La base de datos no fue inicializada correctamente
**Solución:**
```powershell
# Vuelve a crear la BD
mysql -u root -p cableworld_dashboard < backend/init-db.sql
```

### El botón "Nuevo Manual" no aparece
**Posibles causas:**
1. El usuario no tiene permiso `create_manuals`
2. El rol no tiene el permiso asignado

**Solución:**
1. Ve a Ajustes → Gestión de Usuarios
2. Edita el usuario
3. Asegúrate que su rol tenga el permiso `create_manuals`
4. Recarga la página (F5)

### La aplicación carga lentamente
**Solución:**
```powershell
# Borra el caché del navegador (Ctrl+Shift+Supr)
# Luego recarga la página
# Si persiste, aumenta el timeout en el servidor:
# En backend/server.js, busca "timeout" y ajusta el valor
```

### Puerto 3000 ya está en uso
**Solución:**
```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr ":3000"

# Matar el proceso (reemplaza PID con el número mostrado)
taskkill /PID 12345 /F

# O cambiar el puerto en .env:
PORT=3001
```

---

## 🔐 Seguridad Recomendada

### Para Producción

1. **Cambiar todas las contraseñas por defecto**
   - Usuario admin inicial
   - Contraseña de MySQL

2. **Usar HTTPS**
   - Obtén un certificado SSL
   - Configura en server.js

3. **Variables de Entorno Seguras**
   - Usa claves aleatorias de 32+ caracteres
   - Nunca commites el archivo .env a Git

4. **Backup de Base de Datos**
   ```powershell
   mysqldump -u root -p cableworld_dashboard > backup.sql
   ```

5. **Firewall**
   - Solo permite acceso al puerto 3000 desde IPs conocidas
   - En producción, usa un proxy inverso (Nginx, Apache)

---

## 📚 Características Principales

### ✅ Manuales
- Crear, editar, eliminar manuales
- Organizar en carpetas
- Versioning automático
- Búsqueda y filtrado
- Exportar a PDF

### ✅ Árboles de Decisión (Diagramas)
- Crear diagramas interactivos
- Estructura jerárquica de nodos
- Preguntas y soluciones
- Visualización interactiva

### ✅ Knowledge Base Manager
- Organización en carpetas
- Permisos granulares
- Compartir con equipos
- Estadísticas de uso

### ✅ Gestión de Usuarios
- Crear usuarios y roles
- Permisos granulares
- Auditoría de acciones
- Estadísticas de usuario

### ✅ FAQs y Tips
- Base de datos de preguntas frecuentes
- Tips rápidos para agentes
- Búsqueda inteligente

---

## 📞 Soporte y Contacto

Si encuentras problemas:
1. Revisa la sección **Troubleshooting** arriba
2. Verifica los logs en la consola
3. Revisa el registro de auditoría en Ajustes

---

## 📝 Historial de Cambios

### v1.0.0 (Actual)
- ✅ Sistema de autenticación con JWT
- ✅ RBAC (Role-Based Access Control)
- ✅ Gestión de manuales con versionado
- ✅ Árboles de decisión interactivos
- ✅ Knowledge Base Manager profesional
- ✅ Sistema de auditoría
- ✅ Interfaz responsive

---

## 📄 Licencia

Este proyecto es propietario de Cableworld. Todos los derechos reservados.

---

**Última actualización**: 12 de Enero de 2026  
**Versión de documento**: 1.0
