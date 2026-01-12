// Cableworld Backend - Express + SQLite
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const csrf = require('csurf');
const session = require('express-session');
// SECCIÓN 1.7: Import zxcvbn for password entropy validation
const zxcvbn = require('zxcvbn');

require('dotenv').config();

const app = express();
const PORT = 5000;

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // Permitir certificados autofirmados en desarrollo
  }
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.log('[EMAIL] ✗ Email configuration error:', error.message);
    console.log('[EMAIL] Email notifications will be disabled');
  } else {
    console.log('[EMAIL] ✓ Email server ready');
  }
});

// Function to send welcome email
async function sendWelcomeEmail(userEmail, username, appUrl) {
  const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .section { margin-bottom: 20px; }
        .section h2 { color: #667eea; font-size: 18px; margin-top: 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold; }
        .button:hover { background: #764ba2; }
        .credentials { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin: 15px 0; font-family: monospace; }
        .credentials-item { margin: 8px 0; }
        .label { font-weight: bold; color: #667eea; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 Bienvenido a Cableworld</h1>
          <p>Dashboard de conocimiento para agentes de soporte</p>
        </div>
        
        <div class="content">
          <div class="section">
            <h2>Hola,</h2>
            <p>Tu cuenta ha sido creada exitosamente en <strong>Cableworld</strong>. Este es tu portal de acceso a manuales técnicos, árboles de decisión (Fibra), FAQs y herramientas de gestión de conocimiento.</p>
          </div>
          
          <div class="section">
            <h2>🔐 Configurar tu Contraseña</h2>
            <p>Esta es tu primera vez accediendo, así que necesitas configurar tu contraseña:</p>
            
            <div class="credentials">
              <div class="credentials-item"><span class="label">Usuario:</span> ${username}</div>
              <div class="credentials-item"><span class="label">Correo:</span> ${userEmail}</div>
            </div>
            
            <p><strong>Pasos para configurar tu contraseña:</strong></p>
            <ol>
              <li>Abre el siguiente enlace: <a href="${appUrl}" class="button">${appUrl}</a></li>
              <li>Ingresa tu usuario: <strong>${username}</strong></li>
              <li>Haz clic en "Siguiente"</li>
              <li>Verás la opción "Configurar Contraseña"</li>
              <li>Establece una contraseña fuerte que cumpla con:
                <ul>
                  <li>Mínimo 8 caracteres</li>
                  <li>Al menos 1 mayúscula</li>
                  <li>Al menos 1 minúscula</li>
                  <li>Al menos 1 número</li>
                  <li>Al menos 1 carácter especial (!@#$%^&*)</li>
                </ul>
              </li>
              <li>Confirma tu contraseña y ¡listo!</li>
            </ol>
          </div>
          
          <div class="section">
            <h2>📚 ¿Qué es Cableworld Dashboard?</h2>
            <p>Cableworld Dashboard es una plataforma integral de gestión del conocimiento diseñada para agentes de soporte técnico:</p>
            <ul>
              <li><strong>📖 Manuales:</strong> Accede a procedimientos paso a paso para resolver problemas</li>
              <li><strong>🌳 Fibra (Árboles de Decisión):</strong> Diagrams interactivos para diagnóstico rápido</li>
              <li><strong>❓ FAQs:</strong> Respuestas frecuentes organizadas por tema</li>
              <li><strong>📝 Historial:</strong> Acceso rápido a elementos consultados recientemente</li>
              <li><strong>⚙️ Ajustes:</strong> Personaliza tema, tamaño de fuente y gestión de usuarios (admin)</li>
            </ul>
          </div>
          
          <div class="section">
            <h2>⚡ Características Principales</h2>
            <ul>
              <li>Búsqueda rápida de manuales y procedimientos</li>
              <li>Sistema de árboles de decisión interactivos</li>
              <li>Soporte multiidioma en interfaz</li>
              <li>Modo oscuro/claro personalizable</li>
              <li>Acceso offline a documentación</li>
              <li>Gestión de usuarios (para administradores)</li>
            </ul>
          </div>
          
          <div class="section" style="background: #fff3cd; padding: 15px; border-radius: 4px; border-left: 4px solid #ffc107;">
            <p><strong>⚠️ Nota de Seguridad:</strong> Nunca compartas tu contraseña con nadie. Los administradores nunca te pedirán tu contraseña.</p>
          </div>
          
          <div class="footer">
            <p>Si tienes problemas para acceder o preguntas, contacta a tu administrador.</p>
            <p>© 2025 Cableworld - Sistema de Gestión de Conocimiento Técnico</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Check if email config is present
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('[EMAIL] ✗ Email not configured (EMAIL_USER or EMAIL_PASSWORD missing in .env)');
    return false;
  }
  
  try {
    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: '🎓 Bienvenido a Cableworld - Configura tu Contraseña',
      html: emailTemplate
    });
    console.log('[EMAIL] ✓ Welcome email sent to:', userEmail, 'Message ID:', result.messageId);
    return true;
  } catch (err) {
    console.error('[EMAIL] ✗ Error sending email to', userEmail, ':', err.message);
    console.error('[EMAIL] Error details:', {
      from: process.env.EMAIL_USER,
      to: userEmail,
      error: err.code || err.message
    });
    return false;
  }
}

// ===== SESSION & SECURITY MIDDLEWARE =====
// SEGURIDAD: Express session for httpOnly cookie authentication
// SECCIÓN 2.7: Session timeout 30 minutos de inactividad
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'cableworld-dev-secret-key-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 30, // SECCIÓN 2.7: 30 minutos de inactividad (cambió de 24h)
    sameSite: 'strict'
  }
});

// Middleware
// SEGURIDAD: CORS configurado a dominio específico (no abierto)
const corsOptions = {
  origin: function (origin, callback) {
    // Orígenes permitidos para desarrollo y producción
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:5000',  // Same-server frontend (2.2 architecture)
      'http://127.0.0.1:5000',
      'http://localhost:3000',  // Legacy: separate frontend-server.js
      'http://127.0.0.1:3000'
    ];
    
    // Si no hay origin (como en requests de formularios), permitir
    if (!origin) return callback(null, true);
    
    // Comprobar si el origin está permitido
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: Origin not allowed'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(sessionMiddleware);

// ===== 2.2 SINGLE SERVER: Serve frontend static files =====
// Frontend now served from backend/public/
// This allows running both backend API and frontend from single port 5000
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html for SPA routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/index.html'));
});

// SPA routing: serve index.html for any unmatched /diagram* routes
app.get('/diagram*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/html/index.html'));
});

// SEGURIDAD: CSRF protection after session middleware
const csrfProtection = csrf({ cookie: false }); // Uses session store, not cookies

// Middleware for CSRF-protected routes
const protectedRoute = (req, res, next) => {
  // In production, require valid CSRF token
  // For development, make optional based on env
  if (process.env.NODE_ENV === 'production') {
    csrfProtection(req, res, next);
  } else {
    // Development: allow requests without CSRF token
    next();
  }
};

// ===== SECCIÓN 1.3: RATE LIMITING MIDDLEWARE (REDIS-BACKED) =====
// Persistent rate limiting that survives server restarts
// Uses Redis for production, in-memory fallback for development
// Simple in-memory rate limiter (no Redis needed)
const rateLimitCache = new Map();

function createRateLimiter(maxRequests = 100, windowMs = 60000, name = 'api') {
  return (req, res, next) => {
    try {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const key = `ratelimit:${name}:${ip}`;
      const now = Date.now();
      
      // Get or create rate limit entry
      let entry = rateLimitCache.get(key);
      if (!entry || now > entry.resetTime) {
        entry = { count: 0, resetTime: now + windowMs };
        rateLimitCache.set(key, entry);
      }
      
      entry.count++;
      
      // Set rate limit headers (RFC 6585)
      res.set({
        'RateLimit-Limit': maxRequests,
        'RateLimit-Remaining': Math.max(0, maxRequests - entry.count),
        'RateLimit-Reset': Math.ceil(entry.resetTime / 1000)
      });
      
      if (entry.count > maxRequests) {
        const waitSeconds = Math.ceil((entry.resetTime - now) / 1000);
        res.set('Retry-After', Math.max(1, waitSeconds));
        
        
        console.warn(`[RATE_LIMIT] ✗ ${name} - IP ${ip} exceeded (${entry.count}/${maxRequests})`);
        return res.status(429).json({ 
          error: 'Too many requests',
          message: `Rate limit exceeded for ${name}. Try again in ${waitSeconds}s`,
          retryAfter: waitSeconds 
        });
      }
      
      // Log successful requests (debug level)
      if (process.env.DEBUG_RATE_LIMIT) {
        console.debug(`[RATE_LIMIT] ${name} - IP ${ip}: ${entry.count}/${maxRequests}`);
      }
      
      next();
    } catch (err) {
      console.error('[RATE_LIMIT] Error checking rate limit:', err.message);
      // Fail open: allow request if there's an error
      next();
    }
  };
}

// Create limiters with specific thresholds per endpoint
const loginLimiter = createRateLimiter(5, 15 * 60 * 1000, 'login');      // 5 intentos cada 15 min
const searchLimiter = createRateLimiter(100, 60 * 1000, 'search');       // 100 búsquedas por minuto
const apiLimiter = createRateLimiter(1000, 60 * 1000, 'api');            // 1000 requests por minuto

// =====================================================
// PROFESIONAL PERMISSIONS SYSTEM
// =====================================================
// Funciones para verificar y gestionar permisos de carpetas y manuales

// PERMISO CONSTANTS
const PERMISSIONS = {
  // Folder permissions
  'folder.view': 'Ver carpeta',
  'folder.edit': 'Editar carpeta',
  'folder.delete': 'Eliminar carpeta',
  'folder.share': 'Compartir carpeta',
  'folder.manage': 'Gestionar carpeta',
  
  // Manual permissions
  'manual.view': 'Ver manual',
  'manual.edit': 'Editar manual',
  'manual.delete': 'Eliminar manual',
  'manual.publish': 'Publicar manual',
  
  // Admin permissions
  'admin.view': 'Ver administración',
  'admin.manage_users': 'Gestionar usuarios',
  'admin.manage_roles': 'Gestionar roles',
  'admin.manage_permissions': 'Gestionar permisos'
};

// ACCESS LEVELS (para carpetas)
const ACCESS_LEVELS = {
  'private': {
    name: 'Privado',
    icon: '🔒',
    description: 'Solo tú puedes ver esta carpeta'
  },
  'team': {
    name: 'Equipo',
    icon: '👥',
    description: 'Solo los miembros del equipo pueden ver esta carpeta'
  },
  'public': {
    name: 'Público',
    icon: '🌐',
    description: 'Todos pueden ver esta carpeta'
  }
};

// Función para verificar si un usuario tiene permiso sobre una carpeta
async function checkFolderPermission(userId, folderId, permission) {
  return new Promise((resolve, reject) => {
    // Admins tienen acceso a todo
    db.get('SELECT role_id FROM user_roles WHERE user_id = ?', [userId], (err, adminRole) => {
      if (adminRole && adminRole.role_id === 1) {
        return resolve(true); // Admin role ID = 1
      }
      
      db.get(
        `SELECT f.created_by, f.access_level, fp.permission
         FROM folders f
         LEFT JOIN folder_permissions fp ON f.id = fp.folder_id AND fp.user_id = ?
         WHERE f.id = ?`,
        [userId, folderId],
        (err, folder) => {
          if (err) return reject(err);
          if (!folder) return resolve(false);
          
          // Owner tiene todos los permisos
          if (folder.created_by === userId) {
            return resolve(true);
          }
          
          // Check explicit permissions
          db.get(
            `SELECT permission FROM folder_permissions 
             WHERE folder_id = ? AND user_id = ? AND permission = ?`,
            [folderId, userId, permission],
            (err, perm) => {
              if (perm) return resolve(true);
              
              // Check team permissions
              db.all(
                `SELECT DISTINCT fp.permission FROM folder_permissions fp
                 WHERE fp.folder_id = ? AND fp.role_id IN (
                   SELECT role_id FROM user_roles WHERE user_id = ?
                 )`,
                [folderId, userId],
                (err, perms) => {
                  if (err) return resolve(false);
                  const hasPermission = perms && perms.some(p => p.permission === permission);
                  resolve(hasPermission);
                }
              );
            }
          );
        }
      );
    });
  });
}

// Función para verificar acceso a una carpeta basado en access_level
async function checkFolderAccess(userId, folderId) {
  return new Promise((resolve, reject) => {
    // Admins tienen acceso a todo
    db.get('SELECT role_id FROM user_roles WHERE user_id = ?', [userId], (err, adminRole) => {
      if (adminRole && adminRole.role_id === 1) {
        return resolve(true);
      }
      
      db.get(
        `SELECT id, created_by, access_level FROM folders WHERE id = ?`,
        [folderId],
        (err, folder) => {
          if (err) return reject(err);
          if (!folder) return resolve(false);
          
          // Owner siempre puede ver su carpeta
          if (folder.created_by === userId) {
            return resolve(true);
          }
          
          // Public folders: todos pueden verlas
          if (folder.access_level === 'public') {
            return resolve(true);
          }
          
          // Carpetas privadas: solo el owner
          if (folder.access_level === 'private') {
            return resolve(false);
          }
          
          // Team folders: verificar si el usuario es del equipo o fue compartida
          if (folder.access_level === 'team') {
            db.get(
              `SELECT id FROM folder_shares 
               WHERE folder_id = ? AND (shared_with_user_id = ? OR shared_with_team_id IN (
                 SELECT team_id FROM team_members WHERE user_id = ?
               ))`,
              [folderId, userId, userId],
              (err, share) => {
                resolve(!!share);
              }
            );
          } else {
            resolve(false);
          }
        }
      );
    });
  });
}

// Función para obtener los permisos de un usuario sobre una carpeta
async function getUserFolderPermissions(userId, folderId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT permission FROM folder_permissions 
       WHERE (folder_id = ? AND user_id = ?) OR (folder_id = ? AND role_id IN (
         SELECT role_id FROM user_roles WHERE user_id = ?
       ))`,
      [folderId, userId, folderId, userId],
      (err, perms) => {
        if (err) return reject(err);
        resolve(perms ? perms.map(p => p.permission) : []);
      }
    );
  });
}

// Función para compartir una carpeta con un usuario
async function shareFolder(folderId, sharedByUserId, sharedWithUserId, accessLevel = 'viewer') {
  return new Promise((resolve, reject) => {
    const shareId = uuidv4();
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO folder_shares 
       (id, folder_id, shared_with_user_id, access_level, shared_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [shareId, folderId, sharedWithUserId, accessLevel, sharedByUserId, now, now],
      (err) => {
        if (err) return reject(err);
        resolve(shareId);
      }
    );
  });
}

// Función para compartir una carpeta con un equipo
async function shareFolderWithTeam(folderId, sharedByUserId, teamId, accessLevel = 'viewer') {
  return new Promise((resolve, reject) => {
    const shareId = uuidv4();
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO folder_shares 
       (id, folder_id, shared_with_team_id, access_level, shared_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [shareId, folderId, teamId, accessLevel, sharedByUserId, now, now],
      (err) => {
        if (err) return reject(err);
        resolve(shareId);
      }
    );
  });
}

// Database setup
const dbPath = path.join(__dirname, 'cableworld.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Error opening database:', err);
  else console.log('✓ Base de datos conectada:', dbPath);
});

// SECCIÓN 2.3: Run pending database migrations (DISABLED - using initializeDatabase instead)
async function runMigrations() {
  return new Promise((resolve) => {
    // Database initialization is handled by initializeDatabase()
    // which uses CREATE TABLE IF NOT EXISTS pattern
    console.log('✓ Database initialization will be handled by initializeDatabase()');
    resolve(true);
  });
}

// Initialize database tables
function initializeDatabase(callback) {
  try {
    // Read SQL initialization file
    const sqlFilePath = path.join(__dirname, 'init-db.sql');
    const sqlStatements = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlStatements
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    let executedCount = 0;
    let errorOccurred = false;
    
    const executeNextStatement = () => {
      if (executedCount >= statements.length) {
        if (!errorOccurred) {
          console.log('✓ Tablas de base de datos inicializadas desde init-db.sql');
          if (callback) callback();
        }
        return;
      }
      
      const statement = statements[executedCount];
      executedCount++;
      
      db.run(statement, (err) => {
        if (err && !err.message.includes('already exists')) {
          console.error(`Error executing statement ${executedCount}:`, err.message);
          errorOccurred = true;
        }
        executeNextStatement();
      });
    };
    
    executeNextStatement();
  } catch (err) {
    console.error('Error reading SQL file:', err.message);
    if (callback) callback();
  }
}

// ==================== SISTEMA DE PERMISOS Y ROLES ====================

// Permisos disponibles en el sistema - Sistema granular y profesional
const AVAILABLE_PERMISSIONS = {
  // ===== MANUALES =====
  'view_manuals': 'Ver manuales',
  'create_manuals': 'Crear manuales',
  'edit_manuals': 'Editar manuales propios',
  'edit_all_manuals': 'Editar cualquier manual',
  'delete_manuals': 'Eliminar manuales propios',
  'delete_all_manuals': 'Eliminar cualquier manual',
  'publish_manuals': 'Publicar manuales',
  'archive_manuals': 'Archivar manuales',
  'export_manuals': 'Exportar manuales',
  
  // ===== CARPETAS =====
  'view_folders': 'Ver carpetas',
  'create_folders': 'Crear carpetas',
  'edit_folders': 'Editar carpetas propias',
  'edit_all_folders': 'Editar cualquier carpeta',
  'delete_folders': 'Eliminar carpetas propias',
  'delete_all_folders': 'Eliminar cualquier carpeta',
  'share_folders': 'Compartir carpetas',
  'publish_folders': 'Publicar carpetas',
  
  // ===== DIAGRAMAS =====
  'view_diagrams': 'Ver árboles de decisión',
  'create_diagrams': 'Crear árboles de decisión',
  'edit_diagrams': 'Editar árboles propios',
  'edit_all_diagrams': 'Editar cualquier árbol',
  'delete_diagrams': 'Eliminar árboles propios',
  'delete_all_diagrams': 'Eliminar cualquier árbol',
  'export_diagrams': 'Exportar árboles de decisión',
  
  // ===== USUARIOS =====
  'view_users': 'Ver usuarios',
  'create_users': 'Crear usuarios',
  'edit_users': 'Editar usuarios',
  'delete_users': 'Eliminar usuarios',
  'reset_password': 'Restablecer contraseñas',
  'toggle_user_status': 'Activar/Desactivar usuarios',
  
  // ===== ROLES =====
  'manage_roles': 'Gestionar roles',
  'view_roles': 'Ver roles',
  'create_roles': 'Crear roles',
  'edit_roles': 'Editar roles',
  'delete_roles': 'Eliminar roles',
  
  // ===== AUDITORÍA Y SEGURIDAD =====
  'view_audit': 'Ver auditoría',
  'export_audit': 'Exportar auditoría',
  'clear_audit': 'Limpiar auditoría',
  
  // ===== ADMINISTRACIÓN =====
  'manage_specialties': 'Gestionar especialidades',
  'manage_folders': 'Gestionar carpetas',
  'manage_settings': 'Gestionar configuración',
  'manage_system': 'Acceso total al sistema'
};

// Verificar si un usuario tiene un permiso específico
async function checkUserPermission(userId, permission) {
  return new Promise((resolve) => {
    // Los admins tienen todos los permisos
    db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
      if (err || !user) {
        resolve(false);
        return;
      }
      
      if (user.role === 'admin') {
        resolve(true);
        return;
      }
      
      // Obtener roles del usuario
      db.all(
        `SELECT r.permissions FROM roles r
         INNER JOIN user_roles ur ON r.id = ur.role_id
         WHERE ur.user_id = ?`,
        [userId],
        (err, roles) => {
          if (err || !roles || roles.length === 0) {
            resolve(false);
            return;
          }
          
          // Verificar si alguno de los roles del usuario tiene el permiso
          for (const role of roles) {
            try {
              const perms = JSON.parse(role.permissions || '[]');
              if (perms.includes(permission)) {
                resolve(true);
                return;
              }
            } catch (e) {
              // Ignorar errores de parsing
            }
          }
          
          resolve(false);
        }
      );
    });
  });
}

// Middleware para verificar permisos
function requirePermission(permission) {
  return async (req, res, next) => {
    const userId = req.user?.id || req.body?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const hasPermission = await checkUserPermission(userId, permission);
    
    if (!hasPermission) {
      return res.status(403).json({ error: `Permission denied: ${permission}` });
    }
    
    next();
  };
}

// =====================================================
// CENTRALIZED PERMISSION EVALUATION SYSTEM
// =====================================================
// System-wide permission checking functions following specification:
// Admin > Direct Folder/Manual Permissions > Team Permissions > Role Permissions
// Each level can grant/deny access independently

/**
 * Check if a user is system admin
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function isAdmin(userId) {
  return new Promise((resolve) => {
    db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
      resolve(user && user.role === 'admin');
    });
  });
}

/**
 * Check if user has a specific permission through their roles
 * @param {string} userId
 * @param {string} permission
 * @returns {Promise<boolean>}
 */
async function hasRolePermission(userId, permission) {
  return checkUserPermission(userId, permission);
}

/**
 * Check direct folder permission (from folder_shares table)
 * @param {string} userId
 * @param {string} folderId
 * @param {string} permissionLevel - 'viewer', 'editor', 'admin'
 * @returns {Promise<boolean>}
 */
async function hasDirectFolderPermission(userId, folderId, permissionLevel = 'viewer') {
  return new Promise((resolve) => {
    // Folder owner always has full permissions
    db.get('SELECT created_by FROM folders WHERE id = ?', [folderId], (err, folder) => {
      if (!folder) {
        resolve(false);
        return;
      }
      
      if (folder.created_by === userId) {
        resolve(true);
        return;
      }
      
      // Check explicit sharing
      const permissionMap = { viewer: ['viewer', 'editor', 'admin'], editor: ['editor', 'admin'], admin: ['admin'] };
      const validLevels = permissionMap[permissionLevel] || ['viewer'];
      
      const placeholders = validLevels.map(() => '?').join(',');
      db.get(
        `SELECT id FROM folder_shares 
         WHERE folder_id = ? AND shared_with_user_id = ? AND permission_level IN (${placeholders})`,
        [folderId, userId, ...validLevels],
        (err, share) => {
          resolve(!!share);
        }
      );
    });
  });
}

/**
 * Check if user can access folder through team membership
 * @param {string} userId
 * @param {string} folderId
 * @returns {Promise<boolean>}
 */
async function hasTeamFolderPermission(userId, folderId) {
  return new Promise((resolve) => {
    db.get('SELECT access_level, created_by, team_id FROM folders WHERE id = ?', [folderId], (err, folder) => {
      if (!folder) {
        resolve(false);
        return;
      }
      
      // Folder owner has access
      if (folder.created_by === userId) {
        resolve(true);
        return;
      }
      
      // Check if folder is team-level accessible and user is team member
      if (folder.access_level === 'team' && folder.team_id) {
        db.get(
          `SELECT id FROM team_members WHERE team_id = ? AND user_id = ?`,
          [folder.team_id, userId],
          (err, result) => {
            resolve(!!result);
          }
        );
      } else {
        resolve(false);
      }
    });
  });
}

/**
 * Centralized folder access check
 * Evaluation order: Admin > Owner > Direct > Team > Role > Access Level
 * @param {string} userId
 * @param {string} folderId
 * @param {string} action - 'view', 'edit', 'delete', 'share'
 * @returns {Promise<boolean>}
 */
async function canAccessFolder(userId, folderId, action = 'view') {
  try {
    // 1. Admins can do everything
    if (await isAdmin(userId)) {
      return true;
    }
    
    // 2. Check if folder exists
    const folder = await new Promise((resolve) => {
      db.get('SELECT id, created_by, access_level FROM folders WHERE id = ?', [folderId], (err, row) => {
        resolve(row);
      });
    });
    
    if (!folder) {
      return false;
    }
    
    // 3. Folder owner can do everything
    if (folder.created_by === userId) {
      return true;
    }
    
    // 4. For view: check access_level and sharing
    if (action === 'view') {
      // Public folders: anyone can view
      if (folder.access_level === 'public') {
        return true;
      }
      
      // Private folders: only owner
      if (folder.access_level === 'private') {
        return false;
      }
      
      // Team folders: check team membership and explicit sharing
      if (folder.access_level === 'team') {
        const hasTeam = await hasTeamFolderPermission(userId, folderId);
        const hasDirect = await hasDirectFolderPermission(userId, folderId, 'viewer');
        return hasTeam || hasDirect;
      }
    }
    
    // 5. For edit/delete/share: check direct permissions only
    if (action === 'edit' || action === 'delete' || action === 'share') {
      return await hasDirectFolderPermission(userId, folderId, 'editor');
    }
    
    return false;
  } catch (err) {
    console.error('[canAccessFolder] Error:', err);
    return false;
  }
}

/**
 * Check if user can access a manual
 * @param {string} userId
 * @param {string} manualId
 * @param {string} action - 'view', 'edit', 'delete'
 * @returns {Promise<boolean>}
 */
async function canAccessManual(userId, manualId, action = 'view') {
  try {
    // 1. Admins can access everything
    if (await isAdmin(userId)) {
      return true;
    }
    
    // 2. Get manual details
    const manual = await new Promise((resolve) => {
      db.get('SELECT id, created_by, folder_id, is_private FROM manuals WHERE id = ?', [manualId], (err, row) => {
        resolve(row);
      });
    });
    
    if (!manual) {
      return false;
    }
    
    // 3. Owner can do everything
    if (manual.created_by === userId) {
      return true;
    }
    
    // 4. Private manuals: check explicit sharing only
    if (manual.is_private) {
      if (action === 'view') {
        const isShared = await new Promise((resolve) => {
          db.get(
            `SELECT id FROM manual_shares 
             WHERE manual_id = ? AND (shared_with_user_id = ? OR shared_with_team_id IN (
               SELECT team_id FROM team_members WHERE user_id = ?
             ))`,
            [manualId, userId, userId],
            (err, row) => resolve(!!row)
          );
        });
        return isShared;
      }
      return false;
    }
    
    // 5. Non-private manuals: check folder access
    if (manual.folder_id) {
      return await canAccessFolder(userId, manual.folder_id, action === 'view' ? 'view' : 'edit');
    }
    
    // 6. Manual with no folder: check role-based permissions
    if (action === 'view') {
      return await hasRolePermission(userId, 'view_manuals');
    }
    
    return false;
  } catch (err) {
    console.error('[canAccessManual] Error:', err);
    return false;
  }
}

/**
 * Check if user can edit a manual (content only, not permissions)
 * Editors cannot change permissions, privacy, or sharing
 * @param {string} userId
 * @param {string} manualId
 * @returns {Promise<boolean>}
 */
async function canEditManualContent(userId, manualId) {
  try {
    // Admins can always edit
    if (await isAdmin(userId)) {
      return true;
    }
    
    const manual = await new Promise((resolve) => {
      db.get('SELECT id, created_by, folder_id FROM manuals WHERE id = ?', [manualId], (err, row) => {
        resolve(row);
      });
    });
    
    if (!manual) {
      return false;
    }
    
    // Owner can always edit
    if (manual.created_by === userId) {
      return true;
    }
    
    // Check folder edit access
    if (manual.folder_id) {
      return await canAccessFolder(userId, manual.folder_id, 'edit');
    }
    
    // Fallback: check role permission
    return await hasRolePermission(userId, 'edit_manuals');
  } catch (err) {
    console.error('[canEditManualContent] Error:', err);
    return false;
  }
}

/**
 * Check if user can change permissions on a resource
 * Only admins, owners, and explicit admin-level shares can change permissions
 * @param {string} userId
 * @param {string} resourceId
 * @param {string} resourceType - 'folder' or 'manual'
 * @returns {Promise<boolean>}
 */
async function canChangePermissions(userId, resourceId, resourceType = 'folder') {
  try {
    // 1. Admins can always change permissions
    if (await isAdmin(userId)) {
      return true;
    }
    
    if (resourceType === 'folder') {
      const folder = await new Promise((resolve) => {
        db.get('SELECT created_by FROM folders WHERE id = ?', [resourceId], (err, row) => {
          resolve(row);
        });
      });
      
      if (!folder) {
        return false;
      }
      
      // 2. Folder owner can change permissions
      if (folder.created_by === userId) {
        return true;
      }
      
      // 3. User with admin-level folder share can change permissions
      return await hasDirectFolderPermission(userId, resourceId, 'admin');
    }
    
    if (resourceType === 'manual') {
      const manual = await new Promise((resolve) => {
        db.get('SELECT created_by FROM manuals WHERE id = ?', [manualId], (err, row) => {
          resolve(row);
        });
      });
      
      if (!manual) {
        return false;
      }
      
      // Only owner can change manual permissions
      return manual.created_by === userId;
    }
    
    return false;
  } catch (err) {
    console.error('[canChangePermissions] Error:', err);
    return false;
  }
}

/**
 * Master permission evaluation function
 * Combines all permission checks with proper evaluation order
 * @param {string} userId
 * @param {string} action - e.g., 'folder.view', 'manual.edit', 'folder.share'
 * @param {string} resourceId - folderId or manualId
 * @returns {Promise<boolean>}
 */
async function evaluatePermission(userId, action, resourceId) {
  try {
    const [resourceType, actionType] = action.split('.');
    
    if (resourceType === 'folder') {
      return await canAccessFolder(userId, resourceId, actionType);
    }
    
    if (resourceType === 'manual') {
      if (actionType === 'edit') {
        return await canEditManualContent(userId, resourceId);
      }
      return await canAccessManual(userId, resourceId, actionType);
    }
    
    return false;
  } catch (err) {
    console.error('[evaluatePermission] Error:', err);
    return false;
  }
}

// Crear roles por defecto y admin
async function createDefaultRolesAndAdmin() {
  return new Promise((resolve) => {
    // 1. Crear roles por defecto
    const defaultRoles = [
      {
        name: 'Admin',
        description: 'Administrador del sistema con todos los permisos',
        permissions: Object.keys(AVAILABLE_PERMISSIONS),
        is_default: true
      },
      {
        name: 'Agente',
        description: 'Agente de soporte con acceso a lectura y gestión de especialidades',
        permissions: ['view_manuals', 'view_diagrams', 'manage_specialties'],
        is_default: true
      }
    ];

    let rolesCreated = 0;
    
    defaultRoles.forEach(roleData => {
      db.get('SELECT id FROM roles WHERE name = ?', [roleData.name], (err, row) => {
        if (!row) {
          const id = uuidv4();
          const now = new Date().toISOString();
          db.run(
            `INSERT INTO roles (id, name, description, permissions, is_default, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, roleData.name, roleData.description, JSON.stringify(roleData.permissions), roleData.is_default, now, now],
            (err) => {
              if (err) {
                console.error(`Error creating role ${roleData.name}:`, err);
              } else {
                console.log(`✓ Rol '${roleData.name}' creado`);
              }
              rolesCreated++;
              if (rolesCreated === defaultRoles.length) {
                createDefaultAdmin().then(resolve);
              }
            }
          );
        } else {
          rolesCreated++;
          if (rolesCreated === defaultRoles.length) {
            createDefaultAdmin().then(resolve);
          }
        }
      });
    });
  });
}

// Create default admin user using environment variables
async function createDefaultAdmin() {
  return new Promise((resolve) => {
    db.get('SELECT id FROM users WHERE username = ?', ['admin'], async (err, row) => {
      if (row) {
        console.log('✓ Usuario admin ya existe');
        resolve();
        return;
      }
      
      // Get admin credentials from environment variables
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD;
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@cableworld.local';
      
      if (!adminPassword) {
        console.warn('⚠️ ADMIN_PASSWORD no está configurada. Usuario admin no será creado automáticamente.');
        resolve();
        return;
      }
      
      try {
        // SECCIÓN 1.8: BCRYPT 12 ROUNDS (stronger security)
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        const userId = uuidv4();
        const now = new Date().toISOString();
        
        db.run(
          `INSERT INTO users (id, username, email, password, role, name, passwordSet, last_activity, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, adminUsername, adminEmail, hashedPassword, 'admin', 'Administrador', 1, now, now, now],
          function(err) {
            if (err) {
              console.error('Error creating default admin:', err);
              resolve();
              return;
            }
            
            // Asignar rol Admin al usuario admin
            db.get('SELECT id FROM roles WHERE name = ?', ['Admin'], (err, roleRow) => {
              if (roleRow) {
                const userRoleId = uuidv4();
                db.run(
                  `INSERT INTO user_roles (id, user_id, role_id, assigned_at) VALUES (?, ?, ?, ?)`,
                  [userRoleId, userId, roleRow.id, now],
                  (err) => {
                    if (err) {
                      console.error('Error assigning Admin role:', err);
                    } else {
                      console.log('✓ Rol Admin asignado a usuario admin');
                    }
                    resolve(); // Crear carpetas deshabilitado temporalmente
                  }
                );
              } else {
                resolve(); // Crear carpetas deshabilitado temporalmente
              }
            });
          }
        );
      } catch (err) {
        console.error('Error hashing admin password:', err);
        resolve();
      }
    });
  });
}

// Crear carpetas de ejemplo para FASE 16 - DESHABILITADO
// Las carpetas se crean manualmente desde la interfaz de usuario
async function createDefaultFolders() {
  return new Promise((resolve) => {
    // Esta función está deshabilitada - las carpetas se crean desde la UI
    console.log('[KB] Creación automática de carpetas deshabilitada');
    resolve();
  });
}

// ==================== ADMIN SOFT DELETE ENDPOINTS (SECCIÓN 3.6) ====================

// GET /api/admin/deleted-manuals - Ver manuales eliminados (soft delete)
app.get('/api/admin/deleted-manuals', async (req, res) => {
  const userId = req.query.user_id;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = Math.max(parseInt(req.query.offset) || 0, 0);

  // Validar permiso admin
  if (userId) {
    const hasPermission = await checkUserPermission(userId, 'view_audit');
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied: view_audit' });
    }
  }

  // Contar total eliminados
  db.get('SELECT COUNT(*) as total FROM manuals WHERE deleted_at IS NOT NULL', [], (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const total = countResult.total;

    // Obtener eliminados con paginación
    db.all(
      `SELECT id, title, category, role, summary, deleted_at, updatedAt
       FROM manuals
       WHERE deleted_at IS NOT NULL
       ORDER BY deleted_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({
          data: rows || [],
          pagination: {
            limit,
            offset,
            total,
            hasMore: (offset + limit) < total
          }
        });
      }
    );
  });
});

// POST /api/admin/restore-manual/:id - Recuperar manual eliminado
app.post('/api/admin/restore-manual/:id', protectedRoute, async (req, res) => {
  const { userId } = req.body;
  const manualId = req.params.id;

  // Validar permisos
  if (userId) {
    const hasPermission = await checkUserPermission(userId, 'edit_manuals');
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied: edit_manuals' });
    }
  }

  const now = new Date().toISOString();

  db.run(
    `UPDATE manuals SET deleted_at = NULL, updatedAt = ? WHERE id = ? AND deleted_at IS NOT NULL`,
    [now, manualId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Manual not found or not deleted' });
      }

      // Log to audit
      logUserActivity(userId, 'manual_restored', `Manual ${manualId} restored from trash`, 'admin');

      res.json({ 
        message: 'Manual restored successfully',
        id: manualId,
        restoredAt: now
      });
    }
  );
});

// GET /api/admin/deleted-diagrams - Ver diagramas eliminados
app.get('/api/admin/deleted-diagrams', async (req, res) => {
  const userId = req.query.user_id;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = Math.max(parseInt(req.query.offset) || 0, 0);

  // Validar permiso admin
  if (userId) {
    const hasPermission = await checkUserPermission(userId, 'view_audit');
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied: view_audit' });
    }
  }

  db.get('SELECT COUNT(*) as total FROM diagrams WHERE deleted_at IS NOT NULL', [], (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const total = countResult.total;

    db.all(
      `SELECT id, title, parentCategory, subcategory, deleted_at, updatedAt
       FROM diagrams
       WHERE deleted_at IS NOT NULL
       ORDER BY deleted_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({
          data: rows || [],
          pagination: {
            limit,
            offset,
            total,
            hasMore: (offset + limit) < total
          }
        });
      }
    );
  });
});

// POST /api/admin/restore-diagram/:id - Recuperar diagrama eliminado
app.post('/api/admin/restore-diagram/:id', protectedRoute, (req, res) => {
  const diagramId = req.params.id;
  const now = new Date().toISOString();

  db.run(
    `UPDATE diagrams SET deleted_at = NULL, updatedAt = ? WHERE id = ? AND deleted_at IS NOT NULL`,
    [now, diagramId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Diagram not found or not deleted' });
      }

      res.json({
        message: 'Diagram restored successfully',
        id: diagramId,
        restoredAt: now
      });
    }
  );
});

// ==================== SECCIÓN 3.7: CONTENT VERSIONING API ====================

// Middleware para obtener userId de la sesión o del body
const extractUserId = (req, res, next) => {
  const userId = req.user?.id || req.body?.userId || req.query?.userId || req.session?.user?.id || req.session?.userId;
  console.log('[extractUserId] Debug:', {
    path: req.path,
    hasReqUser: !!req.user?.id,
    hasBodyUserId: !!req.body?.userId,
    hasQueryUserId: !!req.query?.userId,
    hasSessionUser: !!req.session?.user,
    hasSessionUserId: !!req.session?.userId,
    sessionUser: req.session?.user ? { id: req.session.user.id, username: req.session.user.username } : null,
    userId: userId
  });
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.userId = userId;
  next();
};

// GET /api/manuals/:id/versions - Get version history for a manual
app.get('/api/manuals/:id/versions', extractUserId, (req, res) => {
  const userId = req.userId;
  const manualId = req.params.id;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const offset = (page - 1) * limit;

  // Check permissions
  checkUserPermission(userId, 'view_audit').then((hasPermission) => {
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied: view_audit required' });
    }

    // Get total count
    db.get('SELECT COUNT(*) as total FROM manual_versions WHERE manual_id = ?', [manualId], (err, countRow) => {
      if (err) return res.status(500).json({ error: err.message });

      // Get versions
      db.all(
        `SELECT 
          version_number, title, editor_username, created_at, change_reason, changed_fields
         FROM manual_versions 
         WHERE manual_id = ? 
         ORDER BY version_number DESC 
         LIMIT ? OFFSET ?`,
        [manualId, limit, offset],
        (err, versions) => {
          if (err) return res.status(500).json({ error: err.message });

          res.json({
            total: countRow.total,
            page: page,
            limit: limit,
            versions: versions.map(v => ({
              ...v,
              changed_fields: v.changed_fields ? JSON.parse(v.changed_fields) : {}
            }))
          });

          // Log audit activity
          logUserActivity(userId, 'manual_versions_viewed', {
            manual_id: manualId,
            version_count: countRow.total
          });
        }
      );
    });
  }).catch(err => res.status(500).json({ error: err.message }));
});

// GET /api/manuals/:id/versions/:versionNumber - Get specific version content
app.get('/api/manuals/:id/versions/:versionNumber', extractUserId, (req, res) => {
  const userId = req.userId;
  const manualId = req.params.id;
  const versionNumber = parseInt(req.params.versionNumber);

  checkUserPermission(userId, 'view_audit').then((hasPermission) => {
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied: view_audit required' });
    }

    db.get(
      `SELECT * FROM manual_versions WHERE manual_id = ? AND version_number = ?`,
      [manualId, versionNumber],
      (err, version) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!version) return res.status(404).json({ error: 'Version not found' });

        res.json(version);
      }
    );
  }).catch(err => res.status(500).json({ error: err.message }));
});

// POST /api/manuals/:id/revert/:versionNumber - Restore a previous version
app.post('/api/manuals/:id/revert/:versionNumber', extractUserId, (req, res) => {
  const userId = req.userId;
  const manualId = req.params.id;
  const versionNumber = parseInt(req.params.versionNumber);
  const reason = req.body.reason || 'Manual version restored';

  checkUserPermission(userId, 'edit_manuals').then((hasPermission) => {
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied: edit_manuals required' });
    }

    // Get the version to restore
    db.get(
      `SELECT title, content, category FROM manual_versions WHERE manual_id = ? AND version_number = ?`,
      [manualId, versionNumber],
      (err, versionData) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!versionData) return res.status(404).json({ error: 'Version not found' });

        const now = new Date().toISOString();

        // Update the manual with restored content
        db.run(
          `UPDATE manuals SET title = ?, content = ?, category = ?, lastEditedBy = ?, updatedAt = ? WHERE id = ?`,
          [versionData.title, versionData.content, versionData.category, userId, now, manualId],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });

            // Get the new version number
            db.get('SELECT version_number FROM manuals WHERE id = ?', [manualId], (err, result) => {
              if (err) return res.status(500).json({ error: err.message });

              // Log the activity
              logUserActivity(userId, 'manual_version_restored', {
                manual_id: manualId,
                restored_from_version: versionNumber,
                new_version_number: result.version_number,
                reason: reason
              });

              res.json({
                manual_id: manualId,
                new_version_number: result.version_number,
                reverted_from: versionNumber,
                message: 'Manual restaurado exitosamente',
                restored_at: now
              });
            });
          }
        );
      }
    );
  }).catch(err => res.status(500).json({ error: err.message }));
});

// GET /api/diagrams/:id/versions - Get version history for a diagram
app.get('/api/diagrams/:id/versions', extractUserId, (req, res) => {
  const userId = req.userId;
  const diagramId = req.params.id;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const offset = (page - 1) * limit;

  checkUserPermission(userId, 'view_audit').then((hasPermission) => {
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied: view_audit required' });
    }

    // Get total count
    db.get('SELECT COUNT(*) as total FROM diagram_versions WHERE diagram_id = ?', [diagramId], (err, countRow) => {
      if (err) return res.status(500).json({ error: err.message });

      // Get versions
      db.all(
        `SELECT 
          version_number, title, editor_username, created_at, change_reason, changed_fields
         FROM diagram_versions 
         WHERE diagram_id = ? 
         ORDER BY version_number DESC 
         LIMIT ? OFFSET ?`,
        [diagramId, limit, offset],
        (err, versions) => {
          if (err) return res.status(500).json({ error: err.message });

          res.json({
            total: countRow.total,
            page: page,
            limit: limit,
            versions: versions.map(v => ({
              ...v,
              changed_fields: v.changed_fields ? JSON.parse(v.changed_fields) : {}
            }))
          });

          // Log audit activity
          logUserActivity(userId, 'diagram_versions_viewed', {
            diagram_id: diagramId,
            version_count: countRow.total
          });
        }
      );
    });
  }).catch(err => res.status(500).json({ error: err.message }));
});

// GET /api/diagrams/:id/versions/:versionNumber - Get specific diagram version
app.get('/api/diagrams/:id/versions/:versionNumber', extractUserId, (req, res) => {
  const userId = req.userId;
  const diagramId = req.params.id;
  const versionNumber = parseInt(req.params.versionNumber);

  checkUserPermission(userId, 'view_audit').then((hasPermission) => {
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied: view_audit required' });
    }

    db.get(
      `SELECT * FROM diagram_versions WHERE diagram_id = ? AND version_number = ?`,
      [diagramId, versionNumber],
      (err, version) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!version) return res.status(404).json({ error: 'Version not found' });

        res.json(version);
      }
    );
  }).catch(err => res.status(500).json({ error: err.message }));
});

// POST /api/diagrams/:id/revert/:versionNumber - Restore a previous diagram version
app.post('/api/diagrams/:id/revert/:versionNumber', extractUserId, (req, res) => {
  const userId = req.userId;
  const diagramId = req.params.id;
  const versionNumber = parseInt(req.params.versionNumber);
  const reason = req.body.reason || 'Diagram version restored';

  checkUserPermission(userId, 'edit_manuals').then((hasPermission) => {
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied: edit_manuals required' });
    }

    // Get the version to restore
    db.get(
      `SELECT title, description, data_structure FROM diagram_versions WHERE diagram_id = ? AND version_number = ?`,
      [diagramId, versionNumber],
      (err, versionData) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!versionData) return res.status(404).json({ error: 'Version not found' });

        const now = new Date().toISOString();

        // Update the diagram with restored content
        db.run(
          `UPDATE diagrams SET title = ?, description = ?, data_structure = ?, lastEditedBy = ?, updatedAt = ? WHERE id = ?`,
          [versionData.title, versionData.description, versionData.data_structure, userId, now, diagramId],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });

            // Get the new version number
            db.get('SELECT version_number FROM diagrams WHERE id = ?', [diagramId], (err, result) => {
              if (err) return res.status(500).json({ error: err.message });

              // Log the activity
              logUserActivity(userId, 'diagram_version_restored', {
                diagram_id: diagramId,
                restored_from_version: versionNumber,
                new_version_number: result.version_number,
                reason: reason
              });

              res.json({
                diagram_id: diagramId,
                new_version_number: result.version_number,
                reverted_from: versionNumber,
                message: 'Diagrama restaurado exitosamente',
                restored_at: now
              });
            });
          }
        );
      }
    );
  }).catch(err => res.status(500).json({ error: err.message }));
});

// ==================== MANUALS API ====================

// Get all manuals
app.get('/api/manuals', async (req, res) => {
  // Paginación y Lazy Loading
  // Parameters: ?limit=20&offset=0&search=query&folder_id=xxx
  
  const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 to prevent abuse
  const offset = Math.max(parseInt(req.query.offset) || 0, 0); // Prevent negatives
  const search = req.query.search ? `%${req.query.search}%` : null;
  const folderId = req.query.folder_id;
  const userId = req.session?.user?.id;
  
  console.log(`[API] GET /api/manuals: limit=${limit}, offset=${offset}, search=${search ? 'enabled' : 'disabled'}, folder_id=${folderId}`);
  
  try {
    // Count total records
    let countQuery = 'SELECT COUNT(*) as total FROM manuals WHERE deleted_at IS NULL';
    let countParams = [];
    
    if (folderId) {
      countQuery += ' AND folder_id = ?';
      countParams.push(folderId);
    }
    
    db.get(countQuery, countParams, async (err, countResult) => {
      if (err) {
        console.error('[API] Error counting manuals:', err);
        return res.status(500).json({ error: err.message });
      }
      
      const total = countResult.total;
      
      // Build query with optional search filter
      let query = 'SELECT * FROM manuals WHERE deleted_at IS NULL';
      let params = [];
      
      if (folderId) {
        query += ' AND folder_id = ?';
        params.push(folderId);
      }
      
      if (search) {
        query += ' AND (title LIKE ? OR content LIKE ?)';
        params.push(search, search);
      }
      
      query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      // Execute paginated query
      db.all(query, params, async (err, rows) => {
        if (err) {
          console.error('[API] Error fetching manuals:', err);
          return res.status(500).json({ error: err.message });
        }
        
        // Filter manuals by user permissions
        let accessibleManuals = [];
        for (const manual of (rows || [])) {
          const canView = await canAccessManual(userId, manual.id, 'view');
          if (canView) {
            try {
              accessibleManuals.push({
                ...manual,
                tags: Array.isArray(manual.tags) ? manual.tags : JSON.parse(manual.tags || '[]'),
                versions: Array.isArray(manual.versions) ? manual.versions : JSON.parse(manual.versions || '[]'),
                content: Array.isArray(manual.content) ? manual.content : JSON.parse(manual.content || '[]')
              });
            } catch (e) {
              console.warn(`[API] Error parsing manual ${manual.id}:`, e.message);
              accessibleManuals.push({
                ...manual,
                tags: [],
                versions: [],
                content: []
              });
            }
          }
        }
        
        // Response with pagination info
        const hasMore = (offset + limit) < total;
        const response = {
          data: accessibleManuals,
          manuals: accessibleManuals,
          value: accessibleManuals,
          pagination: {
            limit,
            offset,
            total,
            hasMore,
            currentPage: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(total / limit)
          },
          Count: accessibleManuals.length
        };
        
        console.log(`[API] ✓ Retornando ${accessibleManuals.length}/${total} manuales (página ${response.pagination.currentPage}/${response.pagination.totalPages})`);
        res.json(response);
      });
    });
  } catch (err) {
    console.error('[API] Error in GET /api/manuals:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single manual
app.get('/api/manuals/:id', async (req, res) => {
  const manualId = req.params.id;
  const userId = req.session?.user?.id;
  
  try {
    // Get manual
    const manual = await new Promise((resolve) => {
      db.get('SELECT * FROM manuals WHERE id = ? AND deleted_at IS NULL', [manualId], (err, row) => {
        resolve(row);
      });
    });
    
    if (!manual) {
      return res.status(404).json({ error: 'Manual not found' });
    }
    
    // Check if user can access this manual
    const canView = await canAccessManual(userId, manualId, 'view');
    if (!canView) {
      return res.status(403).json({ error: 'Permission denied: cannot access this manual' });
    }
    
    // Parse JSON fields
    try {
      manual.tags = Array.isArray(manual.tags) ? manual.tags : JSON.parse(manual.tags || '[]');
      manual.versions = Array.isArray(manual.versions) ? manual.versions : JSON.parse(manual.versions || '[]');
      manual.content = Array.isArray(manual.content) ? manual.content : JSON.parse(manual.content || '[]');
    } catch (e) {
      console.warn(`[API] Error parsing manual ${manual.id}:`, e.message);
      manual.tags = [];
      manual.versions = [];
      manual.content = [];
    }
    
    res.json(manual);
  } catch (err) {
    console.error('[API] Error in GET /api/manuals/:id:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create manual
app.post('/api/manuals', protectedRoute, async (req, res) => {
  const { title, category, role, type, summary, version, tags, steps, userId, folder_id } = req.body;
  const id = req.body.id || `manual-${uuidv4()}`;
  const now = new Date().toISOString();

  console.log('[POST /api/manuals] Request:', { title, userId, id });

  // Validar que el usuario tiene permiso para crear manuales
  if (!userId) {
    console.warn('[POST /api/manuals] ⚠️ No userId provided in body');
    return res.status(403).json({ error: 'Missing userId in request' });
  }
  
  const hasPermission = await checkUserPermission(userId, 'create_manuals');
  console.log('[POST /api/manuals] Permission check:', { userId, hasPermission });
  if (!hasPermission) {
    console.warn('[POST /api/manuals] ❌ Permission denied for user:', userId);
    return res.status(403).json({ error: 'Permission denied: create_manuals' });
  }

  db.run(
    `INSERT INTO manuals (id, title, category, role, type, summary, version, tags, content, versions, folder_id, lastUpdated, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      title,
      category,
      role,
      type,
      summary,
      version,
      JSON.stringify(tags || []),
      JSON.stringify(steps || []),
      JSON.stringify([{ version, note: 'Initial version', date: now }]),
      folder_id || null,
      now,
      now,
      now
    ],
    function(err) {
      if (err) {
        console.error('[POST /api/manuals] ❌ Database error:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      console.log('[POST /api/manuals] ✓ Manual created successfully with ID:', id);
      res.json({ id, message: 'Manual created successfully' });
    }
  );
});

// Update manual
app.put('/api/manuals/:id', protectedRoute, async (req, res) => {
  const manualId = req.params.id;
  const { title, category, role, type, summary, version, tags, steps, versions, userId, folder_id } = req.body;
  const requestUserId = userId || req.session?.user?.id;
  const now = new Date().toISOString();
  
  if (!requestUserId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Check if user can edit this manual (content only)
    const canEdit = await canEditManualContent(requestUserId, manualId);
    if (!canEdit) {
      return res.status(403).json({ error: 'Permission denied: cannot edit this manual' });
    }
    
    // Get current manual for audit
    const manual = await new Promise((resolve) => {
      db.get('SELECT * FROM manuals WHERE id = ?', [manualId], (err, row) => resolve(row));
    });
    
    if (!manual) {
      return res.status(404).json({ error: 'Manual not found' });
    }
    
    // IMPORTANT: Only content fields can be edited, not permissions or privacy
    // Prevent changing: is_private, access_level, created_by, or any sharing settings
    const updates = [];
    const params = [];
    const changedFields = {};
    
    // Allow only content-related fields
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
      changedFields.title = title;
    }
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
      changedFields.category = category;
    }
    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
      changedFields.role = role;
    }
    if (type !== undefined) {
      updates.push('type = ?');
      params.push(type);
      changedFields.type = type;
    }
    if (summary !== undefined) {
      updates.push('summary = ?');
      params.push(summary);
      changedFields.summary = summary;
    }
    if (version !== undefined) {
      updates.push('version = ?');
      params.push(version);
      changedFields.version = version;
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      params.push(JSON.stringify(tags || []));
      changedFields.tags = tags;
    }
    if (steps !== undefined) {
      updates.push('content = ?');
      params.push(JSON.stringify(steps || []));
      changedFields.content = steps;
    }
    if (versions !== undefined) {
      updates.push('versions = ?');
      params.push(JSON.stringify(versions || []));
      changedFields.versions = versions;
    }
    if (folder_id !== undefined) {
      updates.push('folder_id = ?');
      params.push(folder_id || null);
      changedFields.folder_id = folder_id;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No content fields to update' });
    }
    
    updates.push('updatedAt = ?');
    params.push(now);
    params.push(manualId);
    
    const query = `UPDATE manuals SET ${updates.join(', ')} WHERE id = ?`;
    
    db.run(query, params, function(err) {
      if (err) {
        console.error('[API] Error updating manual:', err);
        return res.status(500).json({ error: err.message });
      }
      
      // Log audit
      logUserActivity(requestUserId, 'manual_updated', `Manual ${manualId} content updated`, 'api');
      
      // Return updated manual
      db.get('SELECT * FROM manuals WHERE id = ?', [manualId], (getErr, row) => {
        if (getErr) {
          return res.status(500).json({ error: getErr.message });
        }
        if (row) {
          row.tags = JSON.parse(row.tags || '[]');
          row.versions = JSON.parse(row.versions || '[]');
          row.content = JSON.parse(row.content || '[]');
        }
        res.json(row || { message: 'Manual updated successfully' });
      });
    });
  } catch (err) {
    console.error('[API] Error in PUT /api/manuals/:id:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete manual (SOFT DELETE)
app.delete('/api/manuals/:id', protectedRoute, async (req, res) => {
  const manualId = req.params.id;
  const userId = req.session?.user?.id;
  const now = new Date().toISOString();
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Get manual to verify ownership/permission
    const manual = await new Promise((resolve) => {
      db.get('SELECT created_by FROM manuals WHERE id = ?', [manualId], (err, row) => resolve(row));
    });
    
    if (!manual) {
      return res.status(404).json({ error: 'Manual not found' });
    }
    
    // Check if user can delete (must be owner or admin)
    const isAdmin = await isAdmin(userId);
    const isOwner = manual.created_by === userId;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Permission denied: cannot delete this manual' });
    }
    
    // SOFT DELETE: UPDATE instead of DELETE
    db.run(
      'UPDATE manuals SET deleted_at = ?, updatedAt = ? WHERE id = ? AND deleted_at IS NULL',
      [now, now, manualId],
      function(err) {
        if (err) {
          console.error('[API] Error deleting manual:', err);
          return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Manual not found or already deleted' });
        }
        
        // Log audit
        logUserActivity(userId, 'manual_deleted', `Manual ${manualId} soft deleted`, 'api');
        
        res.json({ 
          message: 'Manual deleted successfully',
          id: manualId,
          deletedAt: now
        });
      }
    );
  } catch (err) {
    console.error('[API] Error in DELETE /api/manuals/:id:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// =====================================================
// MANUAL SHARING - For Private Manuals
// =====================================================

/**
 * POST /api/manuals/:id/share - Share a private manual with a user
 * Only manual owner can share
 */
app.post('/api/manuals/:id/share', protectedRoute, async (req, res) => {
  const manualId = req.params.id;
  const { email, permission_level } = req.body;
  const grantedById = req.session.user?.id;
  
  if (!grantedById) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!email || !permission_level) {
    return res.status(400).json({ error: 'Email and permission_level required' });
  }
  
  if (!['viewer', 'editor', 'admin'].includes(permission_level)) {
    return res.status(400).json({ error: 'Invalid permission_level' });
  }
  
  try {
    // Check if user can change permissions (must be owner or admin)
    const canShare = await canChangePermissions(grantedById, manualId, 'manual');
    if (!canShare) {
      return res.status(403).json({ error: 'Permission denied: cannot share this manual' });
    }
    
    // Get manual
    const manual = await new Promise((resolve) => {
      db.get('SELECT id FROM manuals WHERE id = ?', [manualId], (err, row) => resolve(row));
    });
    
    if (!manual) {
      return res.status(404).json({ error: 'Manual not found' });
    }
    
    // Find user by email
    const user = await new Promise((resolve) => {
      db.get('SELECT id, name FROM users WHERE email = ?', [email], (err, row) => resolve(row));
    });
    
    if (!user) {
      return res.status(404).json({ error: `User with email '${email}' not found` });
    }
    
    // Prevent sharing with self
    if (user.id === grantedById) {
      return res.status(400).json({ error: 'Cannot share with yourself' });
    }
    
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Insert or update sharing record
    db.run(`
      INSERT OR REPLACE INTO manual_shares (id, manual_id, shared_with_user_id, permission_level, shared_by, shared_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, manualId, user.id, permission_level, grantedById, now], function(err) {
      if (err) {
        console.error('[API] Error sharing manual:', err);
        return res.status(500).json({ error: err.message });
      }
      
      // Log audit
      const auditId = uuidv4();
      logUserActivity(grantedById, 'manual_shared', `Manual ${manualId} shared with ${user.email}`, 'api');
      
      res.json({
        success: true,
        data: {
          id,
          manualId,
          userId: user.id,
          email: user.email,
          name: user.name,
          permission_level,
          created_at: now
        }
      });
    });
  } catch (err) {
    console.error('[API] Error in POST /api/manuals/:id/share:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /api/manuals/:id/share/:shareId - Revoke manual sharing
 * Only manual owner can revoke
 */
app.delete('/api/manuals/:id/share/:shareId', protectedRoute, async (req, res) => {
  const manualId = req.params.id;
  const shareId = req.params.shareId;
  const revokedById = req.session.user?.id;
  
  if (!revokedById) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Check if user can revoke access (must be owner or admin)
    const canRevoke = await canChangePermissions(revokedById, manualId, 'manual');
    if (!canRevoke) {
      return res.status(403).json({ error: 'Permission denied: cannot revoke manual sharing' });
    }
    
    // Delete the share record
    db.run(
      'DELETE FROM manual_shares WHERE id = ? AND manual_id = ?',
      [shareId, manualId],
      function(err) {
        if (err) {
          console.error('[API] Error revoking manual access:', err);
          return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Share record not found' });
        }
        
        // Log audit
        logUserActivity(revokedById, 'manual_share_revoked', `Manual ${manualId} sharing revoked`, 'api');
        
        res.json({
          success: true,
          message: 'Sharing revoked successfully'
        });
      }
    );
  } catch (err) {
    console.error('[API] Error in DELETE /api/manuals/:id/share/:shareId:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/manuals/:id/move-to-folder - Mover manual a una carpeta
// GET /api/manuals/favorites - Obtener manuales favoritos
app.get('/api/manuals/favorites', (req, res) => {
  const query = `SELECT id, title, folder_id, icon, color, summary FROM manuals WHERE is_favorite = 1 ORDER BY updatedAt DESC LIMIT 50`;
  
  db.all(query, (err, rows) => {
    if (err) {
      console.error('[API] Error obteniendo favoritos:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ data: rows || [] });
  });
});

// POST /api/manuals/:id/favorite - Toggle manual favorite
app.post('/api/manuals/:id/favorite', protectedRoute, (req, res) => {
  const manualId = req.params.id;
  const { isFavorite } = req.body;
  const now = new Date().toISOString();
  
  const query = `UPDATE manuals SET is_favorite = ?, updatedAt = ? WHERE id = ?`;
  
  db.run(query, [isFavorite ? 1 : 0, now, manualId], (err) => {
    if (err) {
      console.error('[API] Error updating favorite:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Favorite updated', isFavorite });
  });
});

// ==================== FOLDERS API (FASE 16: Knowledge Base Manager) ====================

// GET /api/folders - Obtener todas las carpetas (opcionalmente filtrar por parent_id)
// Enhanced with stats, permissions, and filtering
app.get('/api/folders', async (req, res) => {
  const parentId = req.query.parent_id === 'null' ? null : (req.query.parent_id || null);
  const userId = req.session?.user?.id;
  const accessLevel = req.query.access_level;
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Construir query para obtener todas las carpetas
    let query = `SELECT f.id, f.name, f.description, f.parent_id, f.icon, f.color, f.order_index, f.created_by, f.createdAt, f.updatedAt, f.access_level, f.folder_type FROM folders f`;
    let params = [];
    const conditions = [];
    
    if (parentId === null) {
      conditions.push('f.parent_id IS NULL');
    } else if (parentId) {
      conditions.push('f.parent_id = ?');
      params.push(parentId);
    }
    
    // Filter by access level if provided
    if (accessLevel) {
      conditions.push('f.access_level = ?');
      params.push(accessLevel);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY f.order_index ASC, f.name ASC';
    
    db.all(query, params, async (err, rows) => {
      if (err) {
        console.error('[API] Error fetching folders:', err);
        return res.status(500).json({ error: err.message });
      }
      
      // Filter folders based on user permissions
      const accessibleFolders = [];
      for (const folder of (rows || [])) {
        const canView = await canAccessFolder(userId, folder.id, 'view');
        if (canView) {
          accessibleFolders.push({
            ...folder,
            accessLevel: folder.access_level,
            folderType: folder.folder_type
          });
        }
      }
      
      res.json({ data: accessibleFolders || [], total: accessibleFolders.length });
    });
  } catch (err) {
    console.error('[API] Error in /api/folders:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/folders/tree - Obtener árbol completo de carpetas con estadísticas
app.get('/api/folders/tree', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    console.log('[API] /api/folders/tree requested by user:', userId);
    
    // Get all folders
    const query = `SELECT f.id, f.name, f.description, f.parent_id, f.icon, f.color, f.order_index, f.created_by, f.access_level, f.folder_type FROM folders f ORDER BY f.parent_id ASC, f.order_index ASC, f.name ASC`;
    
    db.all(query, [], async (err, folders) => {
      if (err) {
        console.error('[API] Error fetching folders:', err);
        return res.status(500).json({ error: 'Error fetching folders', data: [] });
      }
      
      if (!folders || folders.length === 0) {
        console.log('[API] No folders found in database');
        return res.json({ data: [] });
      }
      
      // Filter folders by user permissions
      const accessibleFolders = [];
      for (const folder of folders) {
        const canView = await canAccessFolder(userId, folder.id, 'view');
        if (canView) {
          accessibleFolders.push(folder);
        }
      }
      
      console.log('[API] User', userId, 'can access', accessibleFolders.length, 'of', folders.length, 'folders');
      
      // Build tree from accessible folders only
      const folderMap = {};
      const tree = [];
      
      // First pass: create folder map with transformed properties
      accessibleFolders.forEach(folder => {
        folderMap[folder.id] = { 
          ...folder,
          accessLevel: folder.access_level,
          folderType: folder.folder_type,
          children: [],
          manual_count: 0
        };
      });
      
      // Second pass: build parent-child relationships (only include children if parent is accessible)
      accessibleFolders.forEach(folder => {
        if (folder.parent_id && folderMap[folder.parent_id]) {
          // Parent is accessible, add to parent's children
          folderMap[folder.parent_id].children.push(folderMap[folder.id]);
        } else if (!folder.parent_id) {
          // This is a root folder
          tree.push(folderMap[folder.id]);
        }
      });
      
      console.log('[API] Built folder tree with', tree.length, 'accessible root folders');
      res.json({ data: tree });
    });
  } catch (err) {
    console.error('[API] Error in /api/folders/tree:', err);
    res.status(500).json({ error: 'Server error', data: [] });
  }
});

// GET /api/folders/:id/statistics - Obtener estadísticas de una carpeta
app.get('/api/folders/:id/statistics', (req, res) => {
  const folderId = req.params.id;
  
  Promise.all([
    new Promise((resolve) => {
      db.get('SELECT COUNT(*) as count FROM manuals WHERE folder_id = ?', [folderId], (err, result) => {
        resolve(err ? 0 : result?.count || 0);
      });
    }),
    new Promise((resolve) => {
      db.get('SELECT COUNT(*) as count FROM folders WHERE parent_id = ?', [folderId], (err, result) => {
        resolve(err ? 0 : result?.count || 0);
      });
    }),
    new Promise((resolve) => {
      db.get('SELECT SUM(LENGTH(content)) as total FROM manuals WHERE folder_id = ?', [folderId], (err, result) => {
        resolve(err ? 0 : Math.ceil((result?.total || 0) / 1024));
      });
    }),
    new Promise((resolve) => {
      db.get('SELECT COUNT(*) as count FROM manuals WHERE folder_id = ? AND marked_reviewed IS NOT NULL', [folderId], (err, result) => {
        resolve(err ? 0 : result?.count || 0);
      });
    })
  ]).then(([manualCount, folderCount, totalSize, reviewedCount]) => {
    res.json({
      folderId,
      manualCount,
      folderCount,
      totalSize, // KB
      reviewedCount,
      reviewedPercentage: manualCount > 0 ? Math.round((reviewedCount / manualCount) * 100) : 0
    });
  }).catch(err => {
    console.error('[API] Error obteniendo estadísticas:', err);
    res.status(500).json({ error: err.message });
  });
});

// GET /api/folders/:id/permissions - Obtener permisos de una carpeta
app.get('/api/folders/:id/permissions', (req, res) => {
  const folderId = req.params.id;
  
  db.get('SELECT id, access_level FROM folders WHERE id = ?', [folderId], (err, folder) => {
    if (err || !folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.json({
      data: {
        folderId,
        access_level: folder.access_level || 'public'
      }
    });
  });
});

// POST /api/folders/:id/permissions - Actualizar permisos de una carpeta
app.post('/api/folders/:id/permissions', (req, res) => {
  const folderId = req.params.id;
  const { access_level } = req.body;
  
  if (!access_level || !['public', 'private', 'team'].includes(access_level)) {
    return res.status(400).json({ error: 'Invalid access_level' });
  }
  
  db.run('UPDATE folders SET access_level = ? WHERE id = ?', [access_level, folderId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({
      data: {
        folderId,
        access_level,
        message: 'Permissions updated successfully'
      }
    });
  });
});

// GET /api/folders/shared-with-me - Obtener carpetas compartidas conmigo
app.get('/api/folders/shared-with-me', protectedRoute, (req, res) => {
  const userId = req.session?.user?.id;
  
  if (!userId) {
    return res.json({ data: [] });
  }
  
  const query = `
    SELECT 
      f.id as folder_id,
      f.name as folder_name,
      f.icon as folder_icon,
      f.description,
      fs.permission_level,
      fs.created_at as shared_at,
      u.name as shared_by_name,
      u.email as shared_by_email
    FROM folder_shares fs
    JOIN folders f ON fs.folder_id = f.id
    JOIN users u ON fs.created_by = u.id
    WHERE fs.shared_with_user_id = ?
    AND fs.is_active = 1
    ORDER BY fs.created_at DESC
  `;
  
  db.all(query, [userId], (err, rows) => {
    if (err) {
      console.error('[API] Error getting shared folders:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json({
      data: rows || []
    });
  });
});

// GET /api/folders/:id/shared-users - Obtener usuarios con acceso compartido
app.get('/api/folders/:id/shared-users', (req, res) => {
  const folderId = req.params.id;
  
  const query = `
    SELECT 
      fs.id,
      fs.shared_with_user_id as user_id,
      u.email,
      u.name,
      fs.permission_level as access_level,
      fs.shared_at as created_at,
      su.name as granted_by_name
    FROM folder_shares fs
    JOIN users u ON fs.shared_with_user_id = u.id
    LEFT JOIN users su ON fs.shared_by = su.id
    WHERE fs.folder_id = ? AND fs.shared_with_user_id IS NOT NULL
    ORDER BY fs.shared_at DESC
  `;
  
  db.all(query, [folderId], (err, rows) => {
    if (err) {
      console.error('[API] Error getting shared users:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json({
      data: rows || []
    });
  });
});

// POST /api/folders/:id/share - Compartir carpeta con usuario
app.post('/api/folders/:id/share', protectedRoute, async (req, res) => {
  const folderId = req.params.id;
  const { email, access_level, permission_level } = req.body;
  const grantedById = req.session.user?.id;
  const permLevel = access_level || permission_level; // Accept both field names
  
  if (!grantedById) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!email || !permLevel) {
    return res.status(400).json({ error: 'Email and permission_level required' });
  }
  
  if (!['viewer', 'editor', 'admin'].includes(permLevel)) {
    return res.status(400).json({ error: 'Invalid permission_level' });
  }
  
  try {
    // Check if user can share this folder (must be owner or have admin access)
    const canShare = await canChangePermissions(grantedById, folderId, 'folder');
    if (!canShare) {
      return res.status(403).json({ error: 'Permission denied: cannot share this folder' });
    }
    
    // Get folder to verify it exists
    const folder = await new Promise((resolve) => {
      db.get('SELECT id FROM folders WHERE id = ?', [folderId], (err, row) => resolve(row));
    });
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Find user by email
    const user = await new Promise((resolve) => {
      db.get('SELECT id, name FROM users WHERE email = ?', [email], (err, row) => resolve(row));
    });
    
    if (!user) {
      return res.status(404).json({ error: `User with email '${email}' not found` });
    }
    
    // Prevent sharing with self
    if (user.id === grantedById) {
      return res.status(400).json({ error: 'Cannot share with yourself' });
    }
    
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // Insert or update sharing record
    db.run(`
      INSERT OR REPLACE INTO folder_shares (id, folder_id, shared_with_user_id, permission_level, shared_by, shared_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, folderId, user.id, permLevel, grantedById, now], function(err) {
      if (err) {
        console.error('[API] Error sharing folder:', err);
        return res.status(500).json({ error: err.message });
      }
      
      // Log audit
      const auditId = uuidv4();
      const auditData = {
        action: 'shared',
        shared_with: user.email,
        permission_level: permLevel
      };
      
      db.run(`
        INSERT INTO folder_audit_log (id, folder_id, action, changed_fields, created_by, createdAt)
        VALUES (?, ?, 'shared', ?, ?, ?)
      `, [auditId, folderId, JSON.stringify(auditData), grantedById, now]);
      
      res.json({
        success: true,
        data: {
          id,
          folderId,
          userId: user.id,
          email: user.email,
          name: user.name,
          permission_level: permLevel,
          created_at: now
        }
      });
    });
  } catch (err) {
    console.error('[API] Error in POST /api/folders/:id/share:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/folders/:id/revoke-access - Revocar acceso compartido
app.post('/api/folders/:id/revoke-access', protectedRoute, async (req, res) => {
  const folderId = req.params.id;
  const { user_id, share_id } = req.body;
  const revokedById = req.session.user?.id;
  
  if (!revokedById) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!user_id && !share_id) {
    return res.status(400).json({ error: 'user_id or share_id required' });
  }
  
  try {
    // Check if user can revoke access (must be owner or have admin access)
    const canRevoke = await canChangePermissions(revokedById, folderId, 'folder');
    if (!canRevoke) {
      return res.status(403).json({ error: 'Permission denied: cannot revoke folder access' });
    }
    
    // Get user info for audit log
    const user = await new Promise((resolve) => {
      db.get('SELECT email FROM users WHERE id = ?', [user_id], (err, row) => resolve(row));
    });
    
    // Delete the share record
    const query = share_id 
      ? 'DELETE FROM folder_shares WHERE id = ? AND folder_id = ?'
      : 'DELETE FROM folder_shares WHERE folder_id = ? AND shared_with_user_id = ?';
    
    const params = share_id ? [share_id, folderId] : [folderId, user_id];
    
    db.run(query, params, function(err) {
      if (err) {
        console.error('[API] Error revoking access:', err);
        return res.status(500).json({ error: err.message });
      }
      
      // Log audit
      const auditId = uuidv4();
      const now = new Date().toISOString();
      const auditData = {
        action: 'access_revoked',
        revoked_for: user ? user.email : `user_id_${user_id}`
      };
      
      db.run(`
        INSERT INTO folder_audit_log (id, folder_id, action, changed_fields, created_by, createdAt)
        VALUES (?, ?, 'access_revoked', ?, ?, ?)
      `, [auditId, folderId, JSON.stringify(auditData), revokedById, now]);
      
      res.json({
        success: true,
        message: 'Access revoked successfully'
      });
    });
  } catch (err) {
    console.error('[API] Error in POST /api/folders/:id/revoke-access:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/folders/:id/access - Actualizar nivel de acceso para un usuario compartido
app.put('/api/folders/:id/access', protectedRoute, async (req, res) => {
  const folderId = req.params.id;
  const { user_id, access_level, permission_level } = req.body;
  const updatedById = req.session.user?.id;
  const permLevel = access_level || permission_level;
  
  if (!updatedById) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!user_id || !permLevel) {
    return res.status(400).json({ error: 'user_id and permission_level required' });
  }
  
  if (!['viewer', 'editor', 'admin'].includes(permLevel)) {
    return res.status(400).json({ error: 'Invalid permission_level' });
  }
  
  try {
    // Check if user can update folder access (must be owner or have admin access)
    const canUpdate = await canChangePermissions(updatedById, folderId, 'folder');
    if (!canUpdate) {
      return res.status(403).json({ error: 'Permission denied: cannot update folder access' });
    }
    
    // Get folder to verify it exists
    const folder = await new Promise((resolve) => {
      db.get('SELECT id FROM folders WHERE id = ?', [folderId], (err, row) => resolve(row));
    });
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Update access level
    const now = new Date().toISOString();
    db.run(`
      UPDATE folder_shares 
      SET permission_level = ?
      WHERE folder_id = ? AND shared_with_user_id = ?
    `, [permLevel, folderId, user_id], function(err) {
      if (err) {
        console.error('[API] Error updating access level:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Shared access not found' });
      }
      
      // Log audit
      const auditId = uuidv4();
      const auditData = {
        action: 'permission_level_updated',
        user_id,
        new_permission_level: permLevel
      };
      
      db.run(`
        INSERT INTO folder_audit_log (id, folder_id, action, changed_fields, created_by, createdAt)
        VALUES (?, ?, 'access_updated', ?, ?, ?)
      `, [auditId, folderId, JSON.stringify(auditData), updatedById, now]);
      
      res.json({
        success: true,
        message: 'Permission level updated successfully'
      });
    });
  } catch (err) {
    console.error('[API] Error in PUT /api/folders/:id/access:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/folders/search - Buscar carpetas y manuales
app.get('/api/folders/search', (req, res) => {
  const q = req.query.q || '';
  const scope = req.query.scope || 'both'; // 'folders', 'manuals', 'both'
  
  if (!q || q.length < 2) {
    return res.json({ folders: [], manuals: [] });
  }
  
  const searchTerm = `%${q}%`;
  const results = { folders: [], manuals: [] };
  
  let pending = 0;
  if (scope === 'folders' || scope === 'both') {
    pending++;
    const folderQuery = `SELECT id, name, description, icon, color, parent_id, manual_count 
                        FROM folders WHERE name LIKE ? OR description LIKE ? LIMIT 20`;
    db.all(folderQuery, [searchTerm, searchTerm], (err, rows) => {
      if (!err) results.folders = rows || [];
      pending--;
      if (pending === 0) res.json(results);
    });
  }
  
  if (scope === 'manuals' || scope === 'both') {
    pending++;
    const manualQuery = `SELECT id, title, folder_id, summary FROM manuals WHERE title LIKE ? OR summary LIKE ? LIMIT 20`;
    db.all(manualQuery, [searchTerm, searchTerm], (err, rows) => {
      if (!err) results.manuals = rows || [];
      pending--;
      if (pending === 0) res.json(results);
    });
  }
  
  if (pending === 0) res.json(results);
});

// POST /api/folders/:id/favorite - Toggle folder favorite status
app.post('/api/folders/:id/favorite', protectedRoute, (req, res) => {
  const folderId = req.params.id;
  const { isFavorite } = req.body;
  
  const query = 'UPDATE folders SET is_favorite = ?, updatedAt = ? WHERE id = ?';
  const now = new Date().toISOString();
  
  db.run(query, [isFavorite ? 1 : 0, now, folderId], (err) => {
    if (err) {
      console.error('[API] Error actualizando favorito:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Favorito actualizado', isFavorite });
  });
});

// POST /api/folders/:id/move-manuals - Mover múltiples manuales a una carpeta
app.post('/api/folders/:id/move-manuals', protectedRoute, (req, res) => {
  const folderId = req.params.id;
  const { manualIds } = req.body;
  
  if (!Array.isArray(manualIds) || manualIds.length === 0) {
    return res.status(400).json({ error: 'No manuals provided' });
  }
  
  const placeholders = manualIds.map(() => '?').join(',');
  const query = `UPDATE manuals SET folder_id = ?, updatedAt = ? WHERE id IN (${placeholders})`;
  const params = [folderId, new Date().toISOString(), ...manualIds];
  
  db.run(query, params, (err) => {
    if (err) {
      console.error('[API] Error moviendo manuales:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Manuales movidos', count: manualIds.length });
  });
});

// GET /api/folders/recent - Obtener carpetas accedidas recientemente
app.get('/api/folders/recent', (req, res) => {
  const query = `SELECT DISTINCT f.id, f.name, f.icon, f.color, f.last_modified 
                 FROM folders f
                 JOIN history h ON h.element_id = f.id
                 WHERE h.element_type = 'folder'
                 ORDER BY h.timestamp DESC
                 LIMIT 10`;
  
  db.all(query, (err, rows) => {
    if (err) {
      console.error('[API] Error obteniendo carpetas recientes:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ data: rows || [] });
  });
});

// POST /api/folders - Crear nueva carpeta (MEJORADO)
app.post('/api/folders', async (req, res) => {
  const { userId, name, description, parent_id, icon, color, tags, accessLevel, folderType, teamId } = req.body;
  
  // Para KB Manager, permitir crear carpetas sin validación de permisos
  // Solo log warnings si hay problema, pero no rechaces
  if (userId && userId !== 'system') {
    try {
      const hasPermission = await checkUserPermission(userId, 'create_manuals');
      if (!hasPermission) {
        console.warn('[API] User without create_manuals permission, allowing KB folder creation:', userId);
      }
    } catch (err) {
      console.warn('[API] Error checking permissions, allowing KB folder creation:', err.message);
    }
  }
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const query = `
    INSERT INTO folders (id, name, description, parent_id, icon, color, created_by, createdAt, updatedAt, tags, access_level, folder_type, team_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    id,
    name || 'Nueva Carpeta',
    description || '',
    parent_id || null,
    icon || '📁',
    color || '#3498db',
    userId || 'system',
    now,
    now,
    tags || '',
    accessLevel || 'public',
    folderType || 'standard',
    (accessLevel === 'team' && teamId) ? teamId : null
  ];
  
  db.run(query, params, function(err) {
    if (err) {
      console.error('[API] Error creando carpeta:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Log to audit
    logFolderAudit(id, 'CREATE', {}, {}, userId);
    
    res.json({
      id,
      name,
      description,
      parent_id,
      icon,
      color,
      tags,
      access_level: accessLevel || 'public',
      folder_type: folderType || 'standard',
      team_id: (accessLevel === 'team' && teamId) ? teamId : null,
      order_index: 0,
      created_by: userId,
      createdAt: now,
      updatedAt: now
    });
  });
});

// POST /api/cleanup/triggers - Eliminar triggers problemáticos
app.post('/api/cleanup/triggers', (req, res) => {
  db.run('DROP TRIGGER IF EXISTS manuals_auto_version', (err1) => {
    db.run('DROP TRIGGER IF EXISTS diagrams_auto_version', (err2) => {
      if (err1 || err2) {
        res.json({ message: 'Triggers removed (or were not present)' });
      } else {
        res.json({ message: 'Triggers cleaned successfully' });
      }
    });
  });
});

// POST /api/cleanup/folders-duplicates - Eliminar carpetas duplicadas (ADMIN ONLY)
app.post('/api/cleanup/folders-duplicates', (req, res) => {
  // Solo para desarrollo - eliminar duplicados
  db.run(`
    DELETE FROM folders WHERE id NOT IN (
      SELECT MIN(id) FROM folders GROUP BY name, parent_id
    )
  `, (err) => {
    if (err) {
      console.error('[API] Error eliminando duplicados:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Obtener carpetas después de eliminar
    db.all('SELECT COUNT(*) as count FROM folders', (err, result) => {
      res.json({ 
        message: 'Duplicados eliminados', 
        remainingFolders: result[0].count 
      });
    });
  });
});

// POST /api/cleanup/corrupted-folders - Eliminar carpetas con nombres corruptos
app.post('/api/cleanup/corrupted-folders', (req, res) => {
  // Obtener todas las carpetas y eliminar las que tienen caracteres corruptos
  db.all('SELECT id, name FROM folders', (err, folders) => {
    if (err) {
      console.error('[API] Error fetching folders:', err);
      return res.status(500).json({ error: err.message });
    }

    const corruptedIds = [];
    (folders || []).forEach(folder => {
      // Detectar caracteres corruptos (unicode replacement character)
      if (folder.name && folder.name.includes('\ufffd')) {
        corruptedIds.push(folder.id);
        console.log('[CLEANUP] Found corrupted folder:', folder.id, folder.name);
      }
    });

    if (corruptedIds.length === 0) {
      return res.json({ message: 'No corrupted folders found', deleted: 0 });
    }

    // Eliminar carpetas corruptas
    const placeholders = corruptedIds.map(() => '?').join(',');
    db.run(`DELETE FROM folders WHERE id IN (${placeholders})`, corruptedIds, function(err) {
      if (err) {
        console.error('[API] Error deleting corrupted folders:', err);
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ 
        message: 'Corrupted folders deleted', 
        deleted: corruptedIds.length,
        ids: corruptedIds
      });
    });
  });
});

// PUT /api/folders/:id - Actualizar carpeta (MEJORADO)
app.put('/api/folders/:id', protectedRoute, async (req, res) => {
  const { name, description, icon, color, order_index, tags, accessLevel, folderType, settings, isFavorite, teamId } = req.body;
  const folderId = req.params.id;
  const userId = req.session?.user?.id;
  const now = new Date().toISOString();
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Check if user can edit this folder
    const canEdit = await canAccessFolder(userId, folderId, 'edit');
    if (!canEdit) {
      return res.status(403).json({ error: 'Permission denied: cannot edit this folder' });
    }
    
    const updates = [];
    const params = [];
    const changedFields = {};
    
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
      changedFields.name = name;
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
      changedFields.description = description;
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      params.push(icon);
      changedFields.icon = icon;
    }
    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
      changedFields.color = color;
    }
    if (order_index !== undefined) {
      updates.push('order_index = ?');
      params.push(order_index);
      changedFields.order_index = order_index;
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      params.push(tags);
      changedFields.tags = tags;
    }
    if (accessLevel !== undefined) {
      // Only owner/admin can change access level
      const canChangeAccess = await canChangePermissions(userId, folderId, 'folder');
      if (!canChangeAccess) {
        return res.status(403).json({ error: 'Permission denied: cannot change folder access level' });
      }
      updates.push('access_level = ?');
      params.push(accessLevel);
      changedFields.access_level = accessLevel;
    }
    if (folderType !== undefined) {
      updates.push('folder_type = ?');
      params.push(folderType);
      changedFields.folder_type = folderType;
    }
    if (settings !== undefined) {
      updates.push('settings = ?');
      params.push(JSON.stringify(settings));
      changedFields.settings = settings;
    }
    if (isFavorite !== undefined) {
      updates.push('is_favorite = ?');
      params.push(isFavorite ? 1 : 0);
      changedFields.is_favorite = isFavorite;
    }
    if (teamId !== undefined) {
      // Only owner/admin can change team assignment
      const canChangeAccess = await canChangePermissions(userId, folderId, 'folder');
      if (!canChangeAccess) {
        return res.status(403).json({ error: 'Permission denied: cannot change folder team assignment' });
      }
      updates.push('team_id = ?');
      params.push(teamId || null);
      changedFields.team_id = teamId;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push('updatedAt = ?');
    params.push(now);
    params.push(folderId);
    
    const query = `UPDATE folders SET ${updates.join(', ')} WHERE id = ?`;
    
    db.run(query, params, function(err) {
      if (err) {
        console.error('[API] Error updating folder:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Log to audit
      logFolderAudit(folderId, 'UPDATE', changedFields, {}, userId);
      
      res.json({ message: 'Folder updated', folderId, changedFields });
    });
  } catch (err) {
    console.error('[API] Error in PUT /api/folders/:id:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/folders/:id - Eliminar carpeta (MEJORADO con cascada)
app.delete('/api/folders/:id', protectedRoute, async (req, res) => {
  const folderId = req.params.id;
  const userId = req.session?.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Check if user can delete this folder
    const canDelete = await canAccessFolder(userId, folderId, 'delete');
    if (!canDelete) {
      return res.status(403).json({ error: 'Permission denied: cannot delete this folder' });
    }
    
    // Primero, mover todos los manuales en esta carpeta a NULL (raíz)
    db.run('UPDATE manuals SET folder_id = NULL, updatedAt = ? WHERE folder_id = ?', 
      [new Date().toISOString(), folderId], (err) => {
      if (err) {
        console.error('[API] Error moving manuals:', err);
        return res.status(500).json({ error: err.message });
      }
      
      // Luego, eliminar la carpeta (cascada también elimina subcarpetas)
      db.run('DELETE FROM folders WHERE id = ?', [folderId], function(err) {
        if (err) {
          console.error('[API] Error deleting folder:', err);
          return res.status(500).json({ error: err.message });
        }
        
        // Log to audit
        logFolderAudit(folderId, 'DELETE', {}, {}, userId);
        
        res.json({ message: 'Folder deleted' });
      });
    });
  } catch (err) {
    console.error('[API] Error in DELETE /api/folders/:id:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to log folder audit
function logFolderAudit(folderId, action, changedFields, previousValues, userId) {
  const auditId = uuidv4();
  const now = new Date().toISOString();
  
  const query = `
    INSERT INTO folder_audit_log (id, folder_id, action, changed_fields, previous_values, created_by, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [
    auditId,
    folderId,
    action,
    JSON.stringify(changedFields),
    JSON.stringify(previousValues),
    userId,
    now
  ], (err) => {
    if (err) console.error('[AUDIT] Error logging folder audit:', err);
  });
}

// PUT /api/manuals/:id/move-to-folder - Mover un manual a otra carpeta
app.put('/api/manuals/:id/move-to-folder', protectedRoute, (req, res) => {
  const manualId = req.params.id;
  const { folderId, folder_id } = req.body;
  const targetFolderId = folderId || folder_id; // Aceptar ambos formatos
  const now = new Date().toISOString();

  // First, get current folder_id for audit
  db.get('SELECT folder_id FROM manuals WHERE id = ?', [manualId], (err, manual) => {
    if (err) {
      console.error('[API] Error getting manual:', err);
      return res.status(500).json({ error: err.message });
    }

    const previousFolderId = manual?.folder_id;

    // Update manual's folder_id
    db.run(
      'UPDATE manuals SET folder_id = ?, updatedAt = ? WHERE id = ?',
      [targetFolderId || null, now, manualId],
      (err) => {
        if (err) {
          console.error('[API] Error moving manual:', err);
          return res.status(500).json({ error: err.message });
        }

        // Log the movement if both folders exist in audit log
        if (previousFolderId) {
          logFolderAudit(previousFolderId, 'MANUAL_REMOVED', { manualId }, {}, 'system');
        }
        if (targetFolderId) {
          logFolderAudit(targetFolderId, 'MANUAL_ADDED', { manualId }, {}, 'system');
        }

        res.json({ message: 'Manual movido', manualId, folderId: folderId || null });
      }
    );
  });
});

// GET /api/manuals/related/:id - Obtener manuales relacionados (basados en tags)
app.get('/api/manuals/related/:id', (req, res) => {
  const manualId = req.params.id;
  
  // Obtener tags del manual actual
  db.get('SELECT tags FROM manuals WHERE id = ?', [manualId], (err, manual) => {
    if (err || !manual) {
      res.status(404).json({ error: 'Manual not found' });
      return;
    }
    
    try {
      const tags = Array.isArray(manual.tags) ? manual.tags : JSON.parse(manual.tags || '[]');
      
      if (tags.length === 0) {
        res.json({ data: [], total: 0 });
        return;
      }
      
      // Buscar manuales que compartan al menos un tag (excluir el actual)
      const placeholders = tags.map(() => '?').join(',');
      const query = `
        SELECT id, title, tags FROM manuals 
        WHERE id != ? AND tags LIKE ? 
        LIMIT 5
      `;
      
      db.all(query, [manualId, '%' + tags[0] + '%'], (err, related) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        // Calcular relevancia (número de tags en común)
        const enriched = related.map(m => {
          const relatedTags = Array.isArray(m.tags) ? m.tags : JSON.parse(m.tags || '[]');
          const commonTags = tags.filter(t => relatedTags.includes(t));
          return {
            ...m,
            relevance: commonTags.length / tags.length
          };
        }).sort((a, b) => b.relevance - a.relevance);
        
        res.json({ data: enriched, total: enriched.length });
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

// GET /api/manuals/obsolete - Obtener manuales obsoletos (sin actualizar en 6+ meses)
app.get('/api/manuals/obsolete', (req, res) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoISO = sixMonthsAgo.toISOString();
  
  const query = `
    SELECT id, title, lastUpdated, updatedAt 
    FROM manuals 
    WHERE updatedAt < ? AND is_obsolete = 0
    ORDER BY updatedAt ASC
    LIMIT 50
  `;
  
  db.all(query, [sixMonthsAgoISO], (err, rows) => {
    if (err) {
      console.error('[API] Error obteniendo manuales obsoletos:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    const now = new Date();
    const enriched = (rows || []).map(m => {
      const lastUpdate = new Date(m.updatedAt || m.lastUpdated);
      const days = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));
      return {
        id: m.id,
        title: m.title,
        lastUpdated: m.updatedAt || m.lastUpdated,
        daysWithoutUpdate: days
      };
    });
    
    res.json({ data: enriched, total: enriched.length });
  });
});

// ==================== FULL-TEXT SEARCH (FTS5) API ====================

// Enhanced search with FTS5 ranking and filters
app.get('/api/search', (req, res) => {
  const searchQuery = req.query.q ? req.query.q.trim() : '';
  const category = req.query.category || null;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = Math.max(parseInt(req.query.offset) || 0, 0);

  if (!searchQuery || searchQuery.length < 2) {
    return res.json({ results: [], total: 0, limit, offset });
  }

  // Build FTS5 search with ranking and category filter
  // SECCIÓN 3.6: SOFT DELETE - Excluir items eliminados
  let searchSql = `
    SELECT 
      m.id, 
      m.title, 
      m.category,
      m.summary,
      m.tags,
      m.createdAt,
      m.updatedAt,
      rank,
      snippet(manuals_fts, 1, '<mark>', '</mark>', '...', 15) as snippet
    FROM manuals_fts
    JOIN manuals m ON m.id = manuals_fts.id
    WHERE manuals_fts MATCH ? AND m.deleted_at IS NULL
  `;

  let params = [searchQuery];

  if (category) {
    searchSql += ` AND m.category = ?`;
    params.push(category);
  }

  searchSql += `
    ORDER BY rank DESC
    LIMIT ? OFFSET ?
  `;

  params.push(limit, offset);

  // Also get total count for pagination
  // SECCIÓN 3.6: SOFT DELETE - Excluir items eliminados en count
  let countSql = `
    SELECT COUNT(*) as total
    FROM manuals_fts
    JOIN manuals m ON m.id = manuals_fts.id
    WHERE manuals_fts MATCH ? AND m.deleted_at IS NULL
  `;

  let countParams = [searchQuery];

  if (category) {
    countSql += ` AND m.category = ?`;
    countParams.push(category);
  }

  db.get(countSql, countParams, (countErr, countRow) => {
    if (countErr) {
      console.error('[API] Error counting FTS5 results:', countErr);
      return res.status(500).json({ error: countErr.message });
    }

    db.all(searchSql, params, (err, rows) => {
      if (err) {
        console.error('[API] Error performing FTS5 search:', err);
        return res.status(500).json({ error: err.message });
      }

      console.log(`[API] FTS5 Search: "${searchQuery}" → ${rows ? rows.length : 0} results (total: ${countRow.total})`);

      res.json({
        results: rows || [],
        total: countRow.total || 0,
        limit,
        offset,
        query: searchQuery,
        category: category || 'all'
      });
    });
  });
});

// Popular search terms (cached)
app.get('/api/search/popular', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  const query = `
    SELECT category, COUNT(*) as count
    FROM manuals
    GROUP BY category
    ORDER BY count DESC
    LIMIT ?
  `;

  db.all(query, [limit], (err, rows) => {
    if (err) {
      console.error('[API] Error fetching popular categories:', err);
      return res.status(500).json({ error: err.message });
    }

    res.json({ categories: rows || [] });
  });
});

// =====================================================
// PROFESIONAL PERMISSIONS MANAGEMENT API
// =====================================================

// GET /api/permissions - Obtener lista de permisos disponibles
app.get('/api/permissions', protectedRoute, (req, res) => {
  res.json({
    permissions: PERMISSIONS,
    accessLevels: ACCESS_LEVELS
  });
});

// GET /api/folders/:id/access - Obtener información de acceso y permisos
app.get('/api/folders/:id/access', protectedRoute, async (req, res) => {
  const folderId = req.params.id;
  const userId = req.session.user?.id;
  
  try {
    db.get('SELECT created_by, access_level FROM folders WHERE id = ?', [folderId], async (err, folder) => {
      if (err || !folder) {
        return res.status(404).json({ error: 'Folder not found' });
      }
      
      // Verificar que el usuario sea owner o admin
      db.get('SELECT role_id FROM user_roles WHERE user_id = ?', [userId], (err, adminRole) => {
        const isAdmin = adminRole && adminRole.role_id === 1;
        const isOwner = folder.created_by === userId;
        
        if (!isAdmin && !isOwner) {
          return res.status(403).json({ error: 'No permission to view access settings' });
        }
        
        // Obtener todos los usuarios con acceso compartido
        db.all(
          `SELECT 
             fs.id as share_id,
             fs.shared_with_user_id,
             fs.shared_with_team_id,
             fs.access_level,
             fs.created_at,
             fs.shared_by,
             u.username as user_name,
             u.email as user_email,
             t.name as team_name
           FROM folder_shares fs
           LEFT JOIN users u ON fs.shared_with_user_id = u.id
           LEFT JOIN teams t ON fs.shared_with_team_id = t.id
           WHERE fs.folder_id = ?
           ORDER BY fs.created_at DESC`,
          [folderId],
          (err, shares) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            res.json({
              folder: {
                id: folderId,
                created_by: folder.created_by,
                access_level: folder.access_level
              },
              shares: shares || [],
              isOwner,
              isAdmin
            });
          }
        );
      });
    });
  } catch (err) {
    console.error('[API] Error getting folder access:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/folders/:id/access-level - Cambiar nivel de acceso de la carpeta
app.put('/api/folders/:id/access-level', protectedRoute, (req, res) => {
  const folderId = req.params.id;
  const { access_level } = req.body;
  const userId = req.session.user?.id;
  
  if (!['private', 'team', 'public'].includes(access_level)) {
    return res.status(400).json({ error: 'Invalid access_level' });
  }
  
  db.get('SELECT created_by FROM folders WHERE id = ?', [folderId], (err, folder) => {
    if (err || !folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Solo el owner o admin puede cambiar el nivel de acceso
    db.get('SELECT role_id FROM user_roles WHERE user_id = ?', [userId], (err, adminRole) => {
      const isAdmin = adminRole && adminRole.role_id === 1;
      
      if (folder.created_by !== userId && !isAdmin) {
        return res.status(403).json({ error: 'No permission to change access level' });
      }
      
      const now = new Date().toISOString();
      db.run(
        `UPDATE folders SET access_level = ?, updated_at = ? WHERE id = ?`,
        [access_level, now, folderId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Auditoría
          const auditId = uuidv4();
          db.run(
            `INSERT INTO folder_audit_log (id, folder_id, action, changed_fields, created_by, createdAt)
             VALUES (?, ?, 'access_level_changed', ?, ?, ?)`,
            [auditId, folderId, JSON.stringify({ access_level }), userId, now]
          );
          
          res.json({
            success: true,
            message: 'Access level updated successfully',
            access_level
          });
        }
      );
    });
  });
});

// POST /api/folders/:id/share - Compartir carpeta con un usuario específico
app.post('/api/folders/:id/share', protectedRoute, (req, res) => {
  const folderId = req.params.id;
  const { email, access_level = 'viewer' } = req.body;
  const sharedByUserId = req.session.user?.id;
  
  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }
  
  // Verificar que el usuario sea el owner
  db.get('SELECT created_by FROM folders WHERE id = ?', [folderId], (err, folder) => {
    if (err || !folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Solo el owner puede compartir
    if (folder.created_by !== sharedByUserId) {
      return res.status(403).json({ error: 'Only folder owner can share' });
    }
    
    // Encontrar el usuario por email
    db.get('SELECT id, username FROM users WHERE email = ?', [email], (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Crear share
      const shareId = uuidv4();
      const now = new Date().toISOString();
      
      db.run(
        `INSERT INTO folder_shares 
         (id, folder_id, shared_with_user_id, access_level, shared_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [shareId, folderId, user.id, access_level, sharedByUserId, now, now],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE')) {
              return res.status(400).json({ error: 'Folder already shared with this user' });
            }
            return res.status(500).json({ error: err.message });
          }
          
          // Auditoría
          const auditId = uuidv4();
          db.run(
            `INSERT INTO folder_audit_log (id, folder_id, action, changed_fields, created_by, createdAt)
             VALUES (?, ?, 'folder_shared', ?, ?, ?)`,
            [auditId, folderId, JSON.stringify({ shared_with: user.email, access_level }), sharedByUserId, now]
          );
          
          res.json({
            success: true,
            message: `Folder shared with ${user.username}`,
            share: {
              id: shareId,
              user: { id: user.id, username: user.username, email },
              access_level,
              created_at: now
            }
          });
        }
      );
    });
  });
});

// DELETE /api/folders/:id/share/:shareId - Revocar acceso compartido
app.delete('/api/folders/:id/share/:shareId', protectedRoute, (req, res) => {
  const { folderId, shareId } = { folderId: req.params.id, shareId: req.params.shareId };
  const userId = req.session.user?.id;
  
  // Verificar que el usuario sea el owner
  db.get('SELECT created_by FROM folders WHERE id = ?', [folderId], (err, folder) => {
    if (err || !folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    if (folder.created_by !== userId) {
      return res.status(403).json({ error: 'Only folder owner can revoke access' });
    }
    
    db.run(
      `DELETE FROM folder_shares WHERE id = ? AND folder_id = ?`,
      [shareId, folderId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Share not found' });
        }
        
        // Auditoría
        const now = new Date().toISOString();
        const auditId = uuidv4();
        db.run(
          `INSERT INTO folder_audit_log (id, folder_id, action, changed_fields, created_by, createdAt)
           VALUES (?, ?, 'access_revoked', ?, ?, ?)`,
          [auditId, folderId, JSON.stringify({ share_id: shareId }), userId, now]
        );
        
        res.json({
          success: true,
          message: 'Access revoked successfully'
        });
      }
    );
  });
});

// PUT /api/folders/:id/share/:shareId - Actualizar nivel de acceso de un share
app.put('/api/folders/:id/share/:shareId', protectedRoute, (req, res) => {
  const { folderId, shareId } = { folderId: req.params.id, shareId: req.params.shareId };
  const { access_level } = req.body;
  const userId = req.session.user?.id;
  
  if (!['viewer', 'editor', 'admin'].includes(access_level)) {
    return res.status(400).json({ error: 'Invalid access_level' });
  }
  
  db.get('SELECT created_by FROM folders WHERE id = ?', [folderId], (err, folder) => {
    if (err || !folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    if (folder.created_by !== userId) {
      return res.status(403).json({ error: 'Only folder owner can change access level' });
    }
    
    const now = new Date().toISOString();
    db.run(
      `UPDATE folder_shares SET access_level = ?, updated_at = ? WHERE id = ? AND folder_id = ?`,
      [access_level, now, shareId, folderId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Share not found' });
        }
        
        // Auditoría
        const auditId = uuidv4();
        db.run(
          `INSERT INTO folder_audit_log (id, folder_id, action, changed_fields, created_by, createdAt)
           VALUES (?, ?, 'access_level_changed', ?, ?, ?)`,
          [auditId, folderId, JSON.stringify({ share_id: shareId, access_level }), userId, now]
        );
        
        res.json({
          success: true,
          message: 'Access level updated successfully',
          access_level
        });
      }
    );
  });
});

// ==================== DIAGRAMS (FIBRA) API ====================

// Get all diagrams
app.get('/api/diagrams', (req, res) => {
  // FASE 14: Paginación y Lazy Loading para Diagramas
  // Parámetros: ?limit=20&offset=0&category=GPON
  
  console.log('📥 GET /api/diagrams recibido');
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = Math.max(parseInt(req.query.offset) || 0, 0);
  const category = req.query.category || null;
  
  console.log(`[API] GET /api/diagrams: limit=${limit}, offset=${offset}, category=${category || 'all'}`);
  
  try {
    // Contar total de registros
    // SECCIÓN 3.6: SOFT DELETE - Excluir items eliminados
    let countQuery = 'SELECT COUNT(*) as total FROM diagrams WHERE deleted_at IS NULL';
    let countParams = [];
    
    if (category) {
      countQuery += ' AND parentCategory = ?';
      countParams = [category];
    }
    
    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        console.error('❌ Error contando diagramas:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      
      const total = countResult.total;
      
      // Construir query paginada
      // SECCIÓN 3.6: SOFT DELETE - Excluir items eliminados
      let query = 'SELECT * FROM diagrams WHERE deleted_at IS NULL';
      let params = [];
      
      if (category) {
        query += ' AND parentCategory = ?';
        params = [category];
      }
      
      query += ' ORDER BY updatedAt DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      db.all(query, params, (err, rows) => {
        try {
          if (err) {
            console.error('❌ Error en SELECT:', err);
            res.status(500).json({ error: err.message });
            return;
          }
          
          console.log(`📊 Retornando ${rows?.length || 0}/${total} diagramas`);
          
          if (!rows || rows.length === 0) {
            const response = {
              data: [],
              diagrams: [],
              pagination: {
                limit,
                offset,
                total,
                hasMore: false,
                currentPage: Math.floor(offset / limit) + 1,
                totalPages: 0
              }
            };
            console.log('✅ Enviando respuesta vacía con paginación');
            res.json(response);
            return;
          }
          
          const diagrams = rows.map((d, idx) => {
            try {
              console.log(`  [${idx}] id=${d.id}, title=${d.title}, category=${d.parentCategory}`);
              let data = d;
              
              if (d.data) {
                try {
                  data = JSON.parse(d.data);
                  data.id = d.id;
                  data.title = d.title;
                  data.createdAt = d.createdAt;
                  data.updatedAt = d.updatedAt;
                  data.parentCategory = d.parentCategory;
                  data.subcategory = d.subcategory;
                  console.log(`  ✓ Parseado como hierarchical`);
                } catch (e) {
                  console.error(`  ❌ Error parsing data:`, e.message);
                  data = {
                    ...d,
                    nodes: JSON.parse(d.nodes || '{}')
                  };
                }
              } else {
                data = {
                  ...d,
                  nodes: JSON.parse(d.nodes || '{}')
                };
              }
              return data;
            } catch (mapErr) {
              console.error(`❌ Error en map [${idx}]:`, mapErr);
              return d;
            }
          });
          
          const hasMore = (offset + limit) < total;
          const response = {
            data: diagrams,
            diagrams: diagrams,
            pagination: {
              limit,
              offset,
              total,
              hasMore,
              currentPage: Math.floor(offset / limit) + 1,
              totalPages: Math.ceil(total / limit)
            }
          };
          
          console.log(`✅ Enviando ${diagrams.length} diagramas (página ${response.pagination.currentPage}/${response.pagination.totalPages})`);
          res.json(response);
        } catch (callbackErr) {
          console.error('❌ Error en callback:', callbackErr);
          res.status(500).json({ error: callbackErr.message });
        }
      });
    });
  } catch (outerErr) {
    console.error('❌ Error outer:', outerErr);
    res.status(500).json({ error: outerErr.message });
  }
});

// Create diagram
app.post('/api/diagrams', protectedRoute, (req, res) => {
  const diagram = req.body;
  const id = diagram.id || `diagram-${uuidv4()}`;
  const now = new Date().toISOString();
  
  // Ensure id and timestamps are set
  diagram.id = id;
  diagram.createdAt = diagram.createdAt || now;
  diagram.updatedAt = now;
  
  // Set default categories if not provided
  const parentCategory = diagram.parentCategory || 'GPON';
  const subcategory = diagram.subcategory || 'Internet';

  db.run(
    `INSERT INTO diagrams (id, title, rootNodeId, nodes, data, parentCategory, subcategory, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, 
      diagram.title, 
      diagram.rootNodeId || null, 
      JSON.stringify(diagram.nodes || {}),
      JSON.stringify(diagram),
      parentCategory,
      subcategory,
      diagram.createdAt, 
      now
    ],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      diagram.parentCategory = parentCategory;
      diagram.subcategory = subcategory;
      res.json(diagram);
    }
  );
});

// Update diagram
app.put('/api/diagrams/:id', protectedRoute, (req, res) => {
  const diagram = req.body;
  const now = new Date().toISOString();
  diagram.updatedAt = now;
  
  // Set categories from request
  const parentCategory = diagram.parentCategory || 'GPON';
  const subcategory = diagram.subcategory || 'Internet';

  db.run(
    `UPDATE diagrams SET title = ?, rootNodeId = ?, nodes = ?, data = ?, parentCategory = ?, subcategory = ?, updatedAt = ?
     WHERE id = ?`,
    [
      diagram.title, 
      diagram.rootNodeId || null, 
      JSON.stringify(diagram.nodes || {}),
      JSON.stringify(diagram),
      parentCategory,
      subcategory,
      now, 
      req.params.id
    ],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      diagram.parentCategory = parentCategory;
      diagram.subcategory = subcategory;
      res.json(diagram);
    }
  );
});

// Delete diagram (SECCIÓN 3.6: SOFT DELETE)
app.delete('/api/diagrams/:id', protectedRoute, (req, res) => {
  const now = new Date().toISOString();
  
  // SOFT DELETE: UPDATE instead of DELETE
  db.run(
    'UPDATE diagrams SET deleted_at = ?, updatedAt = ? WHERE id = ? AND deleted_at IS NULL',
    [now, now, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: 'Diagram not found or already deleted' });
        return;
      }
      
      res.json({
        message: 'Diagram deleted successfully (soft delete)',
        id: req.params.id,
        deletedAt: now
      });
    }
  );
});

// ==================== SECCIÓN 3.5: TREE PERSISTENCE API ====================

// GET /api/diagrams/:id/nodes - Get all nodes for a diagram
app.get('/api/diagrams/:id/nodes', (req, res) => {
  const diagramId = req.params.id;
  
  db.all(
    'SELECT * FROM diagram_nodes WHERE diagram_id = ? ORDER BY created_at ASC',
    [diagramId],
    (err, nodes) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      db.all(
        'SELECT * FROM diagram_edges WHERE diagram_id = ? ORDER BY created_at ASC',
        [diagramId],
        (err, edges) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          res.json({
            nodes: nodes || [],
            edges: edges || [],
            total: (nodes?.length || 0) + (edges?.length || 0)
          });
        }
      );
    }
  );
});

// POST /api/diagrams/:id/nodes - Create a new node
app.post('/api/diagrams/:id/nodes', protectedRoute, (req, res) => {
  const diagramId = req.params.id;
  const { nodeId, nodeType, label, description, positionX, positionY, metadata } = req.body;
  
  if (!nodeId) {
    res.status(400).json({ error: 'nodeId is required' });
    return;
  }
  
  const id = `node-${uuidv4()}`;
  const now = new Date().toISOString();
  
  db.run(
    `INSERT INTO diagram_nodes (id, diagram_id, node_id, node_type, label, description, position_x, position_y, metadata, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, diagramId, nodeId, nodeType, label, description, positionX || 0, positionY || 0, JSON.stringify(metadata || {}), now, now],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({
        id,
        nodeId,
        nodeType,
        label,
        description,
        positionX,
        positionY,
        metadata: metadata || {},
        createdAt: now
      });
    }
  );
});

// PUT /api/diagrams/:id/nodes/:nodeId - Update a node
app.put('/api/diagrams/:id/nodes/:nodeId', protectedRoute, (req, res) => {
  const { diagramId, nodeId } = req.params;
  const { label, description, positionX, positionY, metadata } = req.body;
  const now = new Date().toISOString();
  
  db.run(
    `UPDATE diagram_nodes SET label = ?, description = ?, position_x = ?, position_y = ?, metadata = ?, updated_at = ?
     WHERE diagram_id = ? AND node_id = ?`,
    [label, description, positionX, positionY, JSON.stringify(metadata || {}), now, req.params.id, req.params.nodeId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: 'Node not found' });
        return;
      }
      
      res.json({ updated: true, updatedAt: now });
    }
  );
});

// DELETE /api/diagrams/:id/nodes/:nodeId - Delete a node and its edges
app.delete('/api/diagrams/:id/nodes/:nodeId', protectedRoute, (req, res) => {
  const diagramId = req.params.id;
  const nodeId = req.params.nodeId;
  
  // First, delete all edges connected to this node
  db.run(
    `DELETE FROM diagram_edges WHERE diagram_id = ? AND (source_node_id = ? OR target_node_id = ?)`,
    [diagramId, nodeId, nodeId],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // Then delete the node
      db.run(
        'DELETE FROM diagram_nodes WHERE diagram_id = ? AND node_id = ?',
        [diagramId, nodeId],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          
          if (this.changes === 0) {
            res.status(404).json({ error: 'Node not found' });
            return;
          }
          
          res.json({ deleted: true, message: 'Node and connected edges deleted' });
        }
      );
    }
  );
});

// POST /api/diagrams/:id/edges - Create a new edge
app.post('/api/diagrams/:id/edges', protectedRoute, (req, res) => {
  const diagramId = req.params.id;
  const { edgeId, sourceNodeId, targetNodeId, edgeType, label, metadata } = req.body;
  
  if (!edgeId || !sourceNodeId || !targetNodeId) {
    res.status(400).json({ error: 'edgeId, sourceNodeId, and targetNodeId are required' });
    return;
  }
  
  const id = `edge-${uuidv4()}`;
  const now = new Date().toISOString();
  
  db.run(
    `INSERT INTO diagram_edges (id, diagram_id, edge_id, source_node_id, target_node_id, edge_type, label, metadata, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, diagramId, edgeId, sourceNodeId, targetNodeId, edgeType, label, JSON.stringify(metadata || {}), now, now],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({
        id,
        edgeId,
        sourceNodeId,
        targetNodeId,
        edgeType,
        label,
        metadata: metadata || {},
        createdAt: now
      });
    }
  );
});

// PUT /api/diagrams/:id/edges/:edgeId - Update an edge
app.put('/api/diagrams/:id/edges/:edgeId', protectedRoute, (req, res) => {
  const { label, edgeType, metadata } = req.body;
  const now = new Date().toISOString();
  
  db.run(
    `UPDATE diagram_edges SET label = ?, edge_type = ?, metadata = ?, updated_at = ?
     WHERE diagram_id = ? AND edge_id = ?`,
    [label, edgeType, JSON.stringify(metadata || {}), now, req.params.id, req.params.edgeId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: 'Edge not found' });
        return;
      }
      
      res.json({ updated: true, updatedAt: now });
    }
  );
});

// DELETE /api/diagrams/:id/edges/:edgeId - Delete an edge
app.delete('/api/diagrams/:id/edges/:edgeId', protectedRoute, (req, res) => {
  db.run(
    'DELETE FROM diagram_edges WHERE diagram_id = ? AND edge_id = ?',
    [req.params.id, req.params.edgeId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        res.status(404).json({ error: 'Edge not found' });
        return;
      }
      
      res.json({ deleted: true });
    }
  );
});

// POST /api/diagrams/:id/validate - Validate tree structure
app.post('/api/diagrams/:id/validate', (req, res) => {
  const diagramId = req.params.id;
  const errors = [];
  
  // Validate that all edges reference existing nodes
  db.all(
    `SELECT e.* FROM diagram_edges e
     WHERE e.diagram_id = ? AND (
       NOT EXISTS (SELECT 1 FROM diagram_nodes n WHERE n.diagram_id = ? AND n.node_id = e.source_node_id) OR
       NOT EXISTS (SELECT 1 FROM diagram_nodes n WHERE n.diagram_id = ? AND n.node_id = e.target_node_id)
     )`,
    [diagramId, diagramId, diagramId],
    (err, invalidEdges) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (invalidEdges && invalidEdges.length > 0) {
        errors.push(`Found ${invalidEdges.length} edges referencing non-existent nodes`);
      }
      
      res.json({
        valid: errors.length === 0,
        errors: errors,
        timestamp: new Date().toISOString()
      });
    }
  );
});

// ==================== PROGRESS API ====================

// Get progress for user
app.get('/api/progress/:userId', (req, res) => {
  db.all('SELECT * FROM progress WHERE userId = ?', [req.params.userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Update progress
app.post('/api/progress', protectedRoute, (req, res) => {
  const { userId, manualId, stepIndex, completed } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();

  db.run(
    `INSERT OR REPLACE INTO progress (id, userId, manualId, stepIndex, completed, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, userId, manualId, stepIndex, completed ? 1 : 0, now],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Progress updated' });
    }
  );
});

// ==================== COMMENTS API ====================

// Get comments for manual
app.get('/api/comments/:manualId', (req, res) => {
  db.all('SELECT * FROM comments WHERE manualId = ?', [req.params.manualId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add comment
app.post('/api/comments', protectedRoute, (req, res) => {
  const { userId, manualId, text } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO comments (id, userId, manualId, text, timestamp)
     VALUES (?, ?, ?, ?, ?)`,
    [id, userId, manualId, text, now],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id, message: 'Comment added' });
    }
  );
});

// Delete comment (SECCIÓN 3.6: SOFT DELETE)
app.delete('/api/comments/:id', protectedRoute, (req, res) => {
  const now = new Date().toISOString();
  
  // SOFT DELETE: UPDATE instead of DELETE (but since comments is not critical for audit, 
  // could use hard delete, but consistency with soft delete pattern)
  db.run('DELETE FROM comments WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Comment deleted' });
  });
});

// ==================== HISTORY API ====================

// Get history for user
app.get('/api/history/:userId', (req, res) => {
  db.all('SELECT * FROM history WHERE userId = ? ORDER BY timestamp DESC LIMIT 100', [req.params.userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add history entry
app.post('/api/history', (req, res) => {
  const { userId, manualId, diagramId, action } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO history (id, userId, manualId, diagramId, action, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, userId, manualId, diagramId, action, now],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id, message: 'History entry added' });
    }
  );
});

// ==================== USERS API ====================

// Get all users (admin only)
app.get('/api/users', protectedRoute, (req, res) => {
  // PROFESIONAL: Verificar permisos para ver usuarios
  if (!req.session.user?.permissions?.includes('view_users') && req.session.user?.roleName !== 'Admin') {
    console.warn(`[SECURITY] Unauthorized access to /api/users by user ${req.session.user?.id}`);
    return res.status(403).json({ error: 'No tienes permiso para ver usuarios' });
  }
  
  // FASE 2.3: Paginación para usuarios
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = Math.max(parseInt(req.query.offset) || 0, 0);
  const search = req.query.search ? `%${req.query.search}%` : null;

  // Contar total de registros
  const countQuery = 'SELECT COUNT(*) as total FROM users';
  
  db.get(countQuery, (err, countResult) => {
    if (err) {
      console.error('[API] Error contando usuarios:', err);
      res.status(500).json({ error: err.message });
      return;
    }

    const total = countResult.total;

    // Construir query paginada
    let query = 'SELECT id, username, email, role, name, passwordSet, createdAt FROM users WHERE 1=1';
    let params = [];

    if (search) {
      query += ' AND (username LIKE ? OR email LIKE ? OR name LIKE ?)';
      params.push(search, search, search);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('[API] Error obteniendo usuarios:', err);
        res.status(500).json({ error: err.message });
        return;
      }

      const hasMore = (offset + limit) < total;
      res.json({
        data: rows || [],
        pagination: {
          limit,
          offset,
          total,
          hasMore
        }
      });
    });
  });
});

// Get user activity status (active/inactive) - MUST be BEFORE :id routes
app.get('/api/users/status/all', protectedRoute, (req, res) => {
  // PROFESIONAL: Verificar permisos
  if (!req.session.user?.permissions?.includes('view_users') && req.session.user?.roleName !== 'Admin') {
    console.warn(`[SECURITY] Unauthorized access to /api/users/status/all by user ${req.session.user?.id}`);
    return res.status(403).json({ error: 'No tienes permiso para ver estado de usuarios' });
  }
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  
  db.all(
    `SELECT id, username, name, last_activity, active,
            CASE 
              WHEN last_activity > ? AND active = 1 THEN 'active'
              ELSE 'inactive'
            END as onlineStatus
     FROM users
     ORDER BY username`,
    [fiveMinutesAgo],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Get individual user details including specialties

// Create user (admin creates user, user must set password on first login)
app.post('/api/users', async (req, res) => {
  const { username, email, name, roles, userId } = req.body;
  
  // Validation
  if (!username || !email) {
    res.status(400).json({ error: 'Username and email are required' });
    return;
  }
  
  // Validar que el usuario tiene permiso para crear usuarios
  if (userId) {
    const hasPermission = await checkUserPermission(userId, 'create_users');
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied: create_users' });
    }
  }
  
  // Si se proporciona un array de roles, debe tener al menos uno
  if (roles && Array.isArray(roles) && roles.length === 0) {
    res.status(400).json({ error: 'At least one role must be assigned' });
    return;
  }
  
  try {
    const id = uuidv4();
    const now = new Date().toISOString();
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    
    // Crear usuario sin contraseña (usuario debe configurarla en primer login)
    // Usar una contraseña temporal que fuerza el cambio
    const tempPassword = 'TEMP_' + Math.random().toString(36).substring(2, 15);
    
    db.run(
      `INSERT INTO users (id, username, email, password, passwordSet, role, name, createdAt, updatedAt, last_activity)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
      [id, username, email, tempPassword, 'user', name || username, now, now, now],
      async function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            res.status(400).json({ error: 'Username or email already exists' });
          } else {
            res.status(500).json({ error: err.message });
          }
          return;
        }
        
        // Asignar roles al usuario
        if (roles && Array.isArray(roles) && roles.length > 0) {
          for (const roleId of roles) {
            await new Promise((resolve, reject) => {
              db.run(
                `INSERT INTO user_roles (id, user_id, role_id, assigned_at) VALUES (?, ?, ?, ?)`,
                [uuidv4(), id, roleId, now],
                (err) => {
                  if (err) {
                    console.error('Error asignando rol:', err);
                  }
                  resolve();
                }
              );
            });
          }
        }
        
        // Send welcome email
        const emailSent = await sendWelcomeEmail(email, username, appUrl);
        
        res.json({ 
          id, 
          username, 
          email,
          name: name || username,
          passwordSet: false,
          roles: roles || [],
          message: 'User created. ' + (emailSent ? 'Welcome email sent.' : 'User must set password on first login.'),
          emailSent: emailSent
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Error creating user: ' + err.message });
  }
});

// Set password for new user (first login)
app.post('/api/setup-password', async (req, res) => {
  const { username, password, confirmPassword } = req.body;
  
  if (!username || !password || !confirmPassword) {
    res.status(400).json({ error: 'Username, password and confirm password are required' });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ error: 'Passwords do not match' });
    return;
  }
  
  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    res.status(400).json({ error: 'Password does not meet requirements', errors: passwordValidation.errors });
    return;
  }
  
  try {
    // SECCIÓN 1.8: BCRYPT 12 ROUNDS (stronger security)
    const hashedPassword = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();
    
    db.run(
      `UPDATE users SET password = ?, passwordSet = 1, updatedAt = ? WHERE (username = ? OR email = ?) AND passwordSet = 0`,
      [hashedPassword, now, username, username],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(400).json({ error: 'User not found or password already set' });
          return;
        }
        res.json({ success: true, message: 'Password set successfully' });
        logUserActivity(username, 'setup_password', 'Contraseña inicial establecida', 'local');
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Error setting password: ' + err.message });
  }
});

// ===== CSRF & SESSION ENDPOINTS =====
// GET CSRF token for forms
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ token: req.csrfToken() });
});

// Session login - stores user in httpOnly session cookie
app.post('/api/session-login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

  if (!username || !password) {
    res.status(400).json({ error: 'Username/email and password are required' });
    return;
  }

  // Try to find user by username or email
  db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], async (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    // Check if user is active
    if (row.active === 0 || row.active === false) {
      logUserActivity(row.id, 'login_failed_inactive', `Intento de login en cuenta inactiva desde ${clientIp}`, clientIp);
      res.status(403).json({ error: 'Account is inactive. Contact your administrator.' });
      return;
    }
    
    // Check if password has been set
    if (!row.passwordSet || !row.password) {
      res.status(401).json({ error: 'Password not set. Please set your password first.', needsSetup: true, username: row.username });
      return;
    }

    try {
      // Compare password with hashed password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, row.password);
      
      if (!isPasswordValid) {
        logUserActivity(row.id, 'login_failed_invalid_password', `Fallo de login desde ${clientIp}`, clientIp);
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Password is valid - get user's role and permissions
      const { password: _, ...user } = row;
      
      // Get user's role and permissions
      db.get(`
        SELECT r.id, r.name, r.permissions 
        FROM roles r
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = ?
        LIMIT 1
      `, [row.id], (err, roleRow) => {
        if (err) {
          res.status(500).json({ error: 'Error retrieving role: ' + err.message });
          return;
        }

        const userData = {
          ...user,
          permissions: roleRow ? JSON.parse(roleRow.permissions || '[]') : [],
          roleId: roleRow ? roleRow.id : null,
          roleName: roleRow ? roleRow.name : null
        };

        // Store user in session (httpOnly cookie)
        req.session.user = userData;
        
        logUserActivity(row.id, 'login', `Inicio de sesión exitoso desde ${clientIp}`, clientIp);
        res.json({ 
          success: true, 
          user: userData,
          message: 'Session established'
        });
      });
    } catch (err) {
      res.status(500).json({ error: 'Error verifying password: ' + err.message });
    }
  });
});

// Logout - destroy session
app.post('/api/session-logout', (req, res) => {
  if (req.session.user) {
    const userId = req.session.user.id;
    logUserActivity(userId, 'logout', 'Cierre de sesión', req.ip);
  }
  
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Error logging out' });
      return;
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// SECCIÓN 2.7: Get session info for timeout warning (frontend can check remaining time)
app.get('/api/session-info', (req, res) => {
  if (!req.session || !req.session.user) {
    res.status(401).json({ authenticated: false, remainingTime: 0 });
    return;
  }
  
  // Get cookie max age (30 minutes = 1800000ms)
  const sessionMaxAge = 1000 * 60 * 30; // 30 minutes
  const now = Date.now();
  const sessionStart = req.session.cookie._expires - sessionMaxAge;
  const elapsedTime = now - sessionStart;
  const remainingTime = Math.max(0, sessionMaxAge - elapsedTime);
  const remainingMinutes = Math.ceil(remainingTime / 60000);
  
  res.json({
    authenticated: true,
    user: req.session.user,
    remainingTime: remainingTime,
    remainingMinutes: remainingMinutes,
    maxAge: sessionMaxAge,
    expiresAt: req.session.cookie._expires,
    warnAt: sessionMaxAge * 0.833 // Warn at 25 min (83.3% of 30)
  });
});

// Check if user has valid session
app.get('/api/session-check', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ 
      authenticated: true, 
      user: req.session.user 
    });
  } else {
    res.status(401).json({ 
      authenticated: false, 
      error: 'No active session'
    });
  }
});

// ===== LEGACY TOKEN-BASED ENDPOINTS (for backward compatibility) =====
// These will be deprecated in favor of session-based auth

// Legacy endpoint: Set password (will be removed)
app.post('/api/auth/set-password', (req, res) => {
  const { userId, password } = req.body;
  
  if (!userId || !password) {
    return res.status(400).json({ error: 'userId and password required' });
  }
  
  try {
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    db.run(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Password set successfully. You can now login.' });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Error setting password: ' + err.message });
  }
});


// Change password endpoint (for authenticated users)
app.post('/api/change-password', async (req, res) => {
  const { userId, currentPassword, newPassword, confirmPassword } = req.body;
  
  if (!userId || !currentPassword || !newPassword || !confirmPassword) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  if (newPassword !== confirmPassword) {
    res.status(400).json({ error: 'Passwords do not match' });
    return;
  }

  // Validate new password strength
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    res.status(400).json({ error: 'New password does not meet requirements', errors: passwordValidation.errors });
    return;
  }

  try {
    // Get user from database
    db.get(
      `SELECT id, password FROM users WHERE id = ?`,
      [userId],
      async (err, user) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        if (!user) {
          res.status(404).json({ error: 'User not found' });
          return;
        }

        // Verify current password
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) {
          res.status(401).json({ error: 'Current password is incorrect' });
          return;
        }

        // Hash new password (SECCIÓN 1.8: BCRYPT 12 ROUNDS - stronger security)
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        const now = new Date().toISOString();

        // Update password
        db.run(
          `UPDATE users SET password = ?, updatedAt = ? WHERE id = ?`,
          [hashedPassword, now, userId],
          function(err) {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ message: 'Password changed successfully' });
          }
        );
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Error changing password: ' + err.message });
  }
});


// ====== NUEVA FASE 12: GESTIÓN DE USUARIOS ======

// Función helper para registrar auditoria
function logUserActivity(userId, action, description, ipAddress = 'unknown') {
  const id = uuidv4();
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO user_audit_log (id, user_id, action, description, ip_address, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, userId, action, description, ipAddress, now]
  );
}

// 2. ROLES PERSONALIZABLES - Obtener roles
// Cache para roles (refrescar cada 5 minutos)
let rolesCache = null;
let rolesCacheTime = 0;
const ROLES_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

app.get('/api/roles', protectedRoute, (req, res) => {
  const now = Date.now();
  
  // Si el cache es válido, devolverlo inmediatamente
  if (rolesCache && (now - rolesCacheTime) < ROLES_CACHE_TTL) {
    return res.json(rolesCache);
  }
  
  // FASE 2.3: Paginación para roles
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = Math.max(parseInt(req.query.offset) || 0, 0);

  // Contar total de registros
  const countQuery = 'SELECT COUNT(*) as total FROM roles';
  
  db.get(countQuery, (err, countResult) => {
    if (err) {
      console.error('[API] Error contando roles:', err);
      res.status(500).json({ error: err.message });
      return;
    }

    const total = countResult.total;

    // Construir query paginada
    let query = 'SELECT * FROM roles ORDER BY name LIMIT ? OFFSET ?';
    
    db.all(query, [limit, offset], (err, rows) => {
      if (err) {
        console.error('[API] Error obteniendo roles:', err);
        res.status(500).json({ error: err.message });
        return;
      }

      const roles = (rows || []).map(r => {
        try {
          const perms = JSON.parse(r.permissions || '[]');
          return {
            ...r,
            permissions: perms
          };
        } catch (e) {
          console.error(`[API] Error parseando permisos para rol "${r.name}":`, e.message);
          return {
            ...r,
            permissions: []
          };
        }
      });

      const hasMore = (offset + limit) < total;
      const response = {
        data: roles,
        pagination: {
          limit,
          offset,
          total,
          hasMore
        }
      };
      
      // Guardar en cache si es la primera página
      if (offset === 0) {
        rolesCache = response;
        rolesCacheTime = now;
      }
      
      res.json(response);
    });
  });
});

// 2. Crear rol
app.post('/api/roles', (req, res) => {
  const { name, description, permissions } = req.body;
  
  if (!name || !Array.isArray(permissions)) {
    res.status(400).json({ error: 'Name and permissions array required' });
    return;
  }
  
  try {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO roles (id, name, description, permissions, is_default, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, description || '', JSON.stringify(permissions), 0, now, now],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        // ✅ LIMPIAR CACHE al crear nuevo rol
        rolesCache = null;
        rolesCacheTime = 0;
        console.log('[API] ✓ Cache limpiado (nuevo rol creado)');
        res.json({ id, name, description, permissions, is_default: 0 });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. ASIGNACIÓN DE ESPECIALIDADES - Actualizar especialidades de usuario
app.put('/api/users/:userId/specialties', protectedRoute, (req, res) => {
  try {
    console.log('[PUT /api/users/:userId/specialties] Received request');
    console.log('[PUT /api/users/:userId/specialties] params:', req.params);
    console.log('[PUT /api/users/:userId/specialties] body:', req.body);
    
    const { specialties } = req.body;
    const userId = req.params.userId;
    
    if (!userId) {
      console.log('[PUT /api/users/:userId/specialties] Error: userId missing');
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!Array.isArray(specialties)) {
      console.log('[PUT /api/users/:userId/specialties] Error: specialties is not an array, type:', typeof specialties);
      return res.status(400).json({ error: 'Specialties must be an array' });
    }
    
    const now = new Date().toISOString();
    const specialtiesJson = JSON.stringify(specialties);
    
    console.log('[PUT /api/users/:userId/specialties] About to update DB:', { userId, specialties, specialtiesJson });
    
    db.run(
      `UPDATE users SET specialties = ?, updatedAt = ? WHERE id = ?`,
      [specialtiesJson, now, userId],
      function(err) {
        if (err) {
          console.error('[PUT /api/users/:userId/specialties] Database error:', err.message);
          console.error('[PUT /api/users/:userId/specialties] Stack:', err.stack);
          return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        
        console.log('[PUT /api/users/:userId/specialties] Update changes:', this.changes);
        
        if (this.changes === 0) {
          console.log('[PUT /api/users/:userId/specialties] User not found:', userId);
          return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('[PUT /api/users/:userId/specialties] Success! Updated specialties:', specialties);
        logUserActivity(userId, 'specialties_updated', `Specialties updated to: ${specialties.join(', ')}`);
        res.json({ message: 'Specialties updated successfully' });
      }
    );
  } catch (err) {
    console.error('[PUT /api/users/:userId/specialties] Catch error:', err.message);
    console.error('[PUT /api/users/:userId/specialties] Stack:', err.stack);
    res.status(500).json({ error: 'Error: ' + err.message });
  }
});

// 4. REGISTRO DE ACTIVIDAD - Obtener audit log de usuario
app.get('/api/users/:userId/audit-log', protectedRoute, (req, res) => {
  // PROFESIONAL: Verificar permisos
  if (!req.session.user?.permissions?.includes('view_audit') && req.session.user?.roleName !== 'Admin') {
    console.warn(`[SECURITY] Unauthorized access to audit log by user ${req.session.user?.id}`);
    return res.status(403).json({ error: 'No tienes permiso para ver auditoría' });
  }
  const { limit = 50, offset = 0 } = req.query;
  
  db.all(
    `SELECT * FROM user_audit_log 
     WHERE user_id = ? 
     ORDER BY createdAt DESC 
     LIMIT ? OFFSET ?`,
    [req.params.userId, parseInt(limit), parseInt(offset)],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows || []);
    }
  );
});

// 4. Obtener audit log completo (admin)
app.get('/api/audit-log', protectedRoute, (req, res) => {
  // PROFESIONAL: Verificar permisos
  if (!req.session.user?.permissions?.includes('view_audit') && req.session.user?.roleName !== 'Admin') {
    console.warn(`[SECURITY] Unauthorized access to /api/audit-log by user ${req.session.user?.id}`);
    return res.status(403).json({ error: 'No tienes permiso para ver auditoría' });
  }
  const { userId, action, limit = 100, offset = 0 } = req.query;
  
  let query = 'SELECT * FROM user_audit_log WHERE 1=1';
  let params = [];
  
  if (userId) {
    query += ' AND user_id = ?';
    params.push(userId);
  }
  
  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }
  
  query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows || []);
  });
});

// 5. RESETEAR CONTRASEÑA DESDE ADMIN
app.post('/api/users/:userId/reset-password', async (req, res) => {
  try {
    // Generar contraseña temporal más fuerte
    const tempPassword = Math.random().toString(36).slice(-8).toUpperCase() + '!' + Math.floor(Math.random() * 10000);
    // SECCIÓN 1.8: BCRYPT 12 ROUNDS (stronger security)
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    const now = new Date().toISOString();
    
    db.run(
      `UPDATE users SET password = ?, passwordSet = 1, updatedAt = ? WHERE id = ?`,
      [hashedPassword, now, req.params.userId],
      async function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        if (this.changes === 0) {
          res.status(404).json({ error: 'User not found' });
          return;
        }
        
        // Obtener info del usuario para enviar email
        db.get('SELECT email, username FROM users WHERE id = ?', [req.params.userId], async (err, user) => {
          if (user && user.email) {
            const emailSent = await sendPasswordResetEmail(user.email, user.username, tempPassword);
            logUserActivity(req.params.userId, 'password_reset', 'Password reset by admin');
            res.json({ 
              message: 'Password reset successfully. Email sent to user.',
              tempPassword: tempPassword,
              emailSent: emailSent
            });
          } else {
            res.json({ 
              message: 'Password reset successfully',
              tempPassword: tempPassword,
              warning: 'No email on file - user will need to contact admin'
            });
          }
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Error resetting password: ' + err.message });
  }
});

// 7. ESTADÍSTICAS DE USO POR USUARIO
app.get('/api/users/:userId/statistics', protectedRoute, (req, res) => {
  // PROFESIONAL: Verificar permisos
  if (!req.session.user?.permissions?.includes('view_users') && req.session.user?.roleName !== 'Admin') {
    console.warn(`[SECURITY] Unauthorized access to user statistics by user ${req.session.user?.id}`);
    return res.status(403).json({ error: 'No tienes permiso para ver estadísticas' });
  }
  const userId = req.params.userId;
  
  // Obtener info del usuario
  db.get(
    'SELECT id, username, email, specialties, active, createdAt FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      // Contar historial de actividades
      db.get(
        'SELECT COUNT(*) as totalActions FROM user_audit_log WHERE user_id = ?',
        [userId],
        (err, activityCount) => {
          // Obtener últimas acciones
          db.all(
            `SELECT action, createdAt FROM user_audit_log 
             WHERE user_id = ? 
             ORDER BY createdAt DESC 
             LIMIT 1`,
            [userId],
            (err, lastAction) => {
              res.json({
                user: user,
                statistics: {
                  totalActions: activityCount?.totalActions || 0,
                  lastAction: lastAction?.[0]?.createdAt || null,
                  specialties: user.specialties ? JSON.parse(user.specialties) : [],
                  accountStatus: user.active ? 'active' : 'inactive',
                  accountAge: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) + ' days'
                }
              });
            }
          );
        }
      );
    }
  );
});

// Función helper para enviar email de reset de contraseña
async function sendPasswordResetEmail(email, username, tempPassword) {
  try {
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@cableworld.local',
      to: email,
      subject: 'Password Reset - Cableworld',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
            .password-box { background: white; border: 2px solid #667eea; padding: 15px; border-radius: 6px; margin: 20px 0; font-family: monospace; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
            </div>
            <div class="content">
              <p>Hola ${username},</p>
              <p>Tu contraseña ha sido reseteada por un administrador. Tu contraseña temporal es:</p>
              <div class="password-box">
                <strong>${tempPassword}</strong>
              </div>
              <p><strong>Pasos:</strong></p>
              <ol>
                <li>Abre <a href="${appUrl}">${appUrl}</a></li>
                <li>Ingresa tu usuario: <strong>${username}</strong></li>
                <li>Usa la contraseña temporal arriba</li>
                <li>Cambiarás tu contraseña en el login</li>
              </ol>
              <p style="color: #999; font-size: 12px; margin-top: 30px;">Por razones de seguridad, esta contraseña temporal expirará en 24 horas.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.error('Error sending password reset email:', err);
    return false;
  }
}

// Validate password strength
function validatePasswordStrength(password) {
  const errors = [];
  
  // Basic requirements
  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Al menos una mayúscula');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Al menos una minúscula');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Al menos un número');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Al menos un carácter especial (!@#$%^&*)');
  }
  
  // SECCIÓN 1.7: Add entropy validation using zxcvbn
  // zxcvbn score: 0=very weak, 1=weak, 2=fair, 3=good, 4=very strong
  const entropyResult = zxcvbn(password);
  if (entropyResult.score < 3) {
    errors.push(`Contraseña poco segura (entropía: ${entropyResult.score}/4). Sugerencias: ${(entropyResult.feedback?.suggestions || []).join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors: errors,
    strength: entropyResult.score // Retornar el score de seguridad
  };
}

// Login user (accepts email or username)
// FASE 14: Rate Limiting en Login (5 intentos cada 15 min)
app.post('/api/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

  if (!username || !password) {
    res.status(400).json({ error: 'Username/email and password are required' });
    return;
  }

  // Try to find user by username or email
  db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], async (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    // Check if user is active
    if (row.active === 0 || row.active === false) {
      logUserActivity(row.id, 'login_failed_inactive', `Intento de login en cuenta inactiva desde ${clientIp}`, clientIp);
      res.status(403).json({ error: 'Account is inactive. Contact your administrator.' });
      return;
    }
    
    // Check if password has been set
    if (!row.passwordSet || !row.password) {
      res.status(401).json({ error: 'Password not set. Please set your password first.', needsSetup: true, username: row.username });
      return;
    }

    try {
      // Compare password with hashed password using bcrypt
      const isPasswordValid = await bcrypt.compare(password, row.password);
      
      if (!isPasswordValid) {
        logUserActivity(row.id, 'login_failed_invalid_password', `Fallo de login desde ${clientIp}`, clientIp);
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Password is valid, get user's role and permissions
      const { password: _, ...user } = row;
      
      // Get user's role and permissions
      db.get(`
        SELECT r.id, r.name, r.permissions 
        FROM roles r
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = ?
        LIMIT 1
      `, [row.id], (err, roleRow) => {
        if (!roleRow) {
          // User without role, return empty permissions
          logUserActivity(row.id, 'login', `Inicio de sesión exitoso desde ${clientIp}`, clientIp);
          res.json({ user: { ...user, permissions: [] }, token: uuidv4() });
          return;
        }
        
        const permissions = JSON.parse(roleRow.permissions || '[]');
        logUserActivity(row.id, 'login', `Inicio de sesión exitoso desde ${clientIp}`, clientIp);
        res.json({ user: { ...user, permissions, roleId: roleRow.id, roleName: roleRow.name }, token: uuidv4() });
      });
    } catch (err) {
      res.status(500).json({ error: 'Error verifying password: ' + err.message });
    }
  });
});

// Check if user exists and their password setup status (first step of login)
app.post('/api/check-user-setup-status', (req, res) => {
  const { username } = req.body;

  if (!username) {
    res.status(400).json({ error: 'Username or email is required' });
    return;
  }

  db.get('SELECT id, username, email, name, passwordSet FROM users WHERE username = ? OR email = ?', [username, username], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!row) {
      res.status(404).json({ error: 'User not found', userFound: false });
      return;
    }

    res.json({ 
      userFound: true,
      user: { 
        id: row.id,
        username: row.username, 
        email: row.email, 
        name: row.name 
      }, 
      needsPasswordSetup: !row.passwordSet 
    });
  });
});

// Check if user exists (for session validation)
app.post('/api/validate-user/:id', (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    res.status(400).json({ error: 'User ID is required' });
    return;
  }

  db.get('SELECT id, username, role FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!row) {
      res.status(404).json({ error: 'User not found', exists: false });
      return;
    }

    res.json({ exists: true, user: { id: row.id, username: row.username, role: row.role } });
  });
});

// Check if user needs to setup password (accept email or username)
app.post('/api/check-password-status', (req, res) => {
  const { username } = req.body;

  if (!username) {
    res.status(400).json({ error: 'Username or email is required' });
    return;
  }

  db.get('SELECT id, username, email, name, passwordSet FROM users WHERE username = ? OR email = ?', [username, username], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!row) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ 
      user: { 
        id: row.id,
        username: row.username, 
        email: row.email, 
        name: row.name 
      }, 
      needsPasswordSetup: !row.passwordSet 
    });
  });
});

// Delete user
app.delete('/api/users/:userId', protectedRoute, async (req, res) => {
  const { userId } = req.body;
  
  // Validar que el usuario tiene permiso para gestionar usuarios
  if (userId) {
    const hasPermission = await checkUserPermission(userId, 'edit_users');
    if (!hasPermission) {
      return res.status(403).json({ error: 'Permission denied: edit_users' });
    }
  }
  
  db.run('DELETE FROM users WHERE id = ?', [req.params.userId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'User deleted' });
  });
});

// ==================== ROLES API ====================

// Get all available permissions
app.get('/api/permissions', (req, res) => {
  res.json(AVAILABLE_PERMISSIONS);
});

// Get all roles

// Create new role
// Update role
app.put('/api/roles/:id', protectedRoute, (req, res) => {
  const { name, description, permissions } = req.body;
  const now = new Date().toISOString();
  
  db.run(
    `UPDATE roles SET name = ?, description = ?, permissions = ?, updatedAt = ? WHERE id = ?`,
    [name, description || '', JSON.stringify(permissions), now, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      // ✅ LIMPIAR CACHE al actualizar rol
      rolesCache = null;
      rolesCacheTime = 0;
      console.log('[API] ✓ Cache limpiado (rol actualizado)');
      res.json({ id: req.params.id, name, description, permissions });
    }
  );
});

// Delete role
app.delete('/api/roles/:id', protectedRoute, (req, res) => {
  // Don't allow deletion of default roles
  db.get('SELECT is_default FROM roles WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row && row.is_default) {
      res.status(400).json({ error: 'Cannot delete default roles' });
      return;
    }
    
    db.run('DELETE FROM roles WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      // ✅ LIMPIAR CACHE al eliminar rol
      rolesCache = null;
      rolesCacheTime = 0;
      console.log('[API] ✓ Cache limpiado (rol eliminado)');
      res.json({ message: 'Role deleted' });
    });
  });
});

// Get user roles
app.get('/api/users/:userId/roles', (req, res) => {
  db.all(
    `SELECT r.* FROM roles r
     JOIN user_roles ur ON r.id = ur.role_id
     WHERE ur.user_id = ?
     ORDER BY r.name`,
    [req.params.userId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      const roles = rows.map(r => ({
        ...r,
        permissions: JSON.parse(r.permissions || '[]')
      }));
      res.json(roles);
    }
  );
});

// Get individual user details including specialties - MUST be LAST
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json(row);
  });
});

// Assign role to user
app.post('/api/users/:userId/roles/:roleId', protectedRoute, (req, res) => {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.run(
    `INSERT OR IGNORE INTO user_roles (id, user_id, role_id, assigned_at) VALUES (?, ?, ?, ?)`,
    [id, req.params.userId, req.params.roleId, now],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ message: 'Role assigned' });
    }
  );
});

// Remove role from user
app.delete('/api/users/:userId/roles/:roleId', protectedRoute, (req, res) => {
  db.run(
    `DELETE FROM user_roles WHERE user_id = ? AND role_id = ?`,
    [req.params.userId, req.params.roleId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Role removed' });
    }
  );
});

// Update all roles for a user at once
app.put('/api/users/:userId/roles', protectedRoute, async (req, res) => {
  const { roles, adminId } = req.body;
  const userId = req.params.userId;
  
  console.log('\n[PUT /api/users/:userId/roles] Iniciando...');
  console.log('  userId:', userId);
  console.log('  roles a asignar:', roles);
  console.log('  adminId:', adminId);
  
  if (!Array.isArray(roles)) {
    console.error('[PUT roles] ERROR: roles no es un array');
    return res.status(400).json({ error: 'Roles must be an array' });
  }
  
  if (roles.length === 0) {
    console.error('[PUT roles] ERROR: roles está vacío');
    return res.status(400).json({ error: 'At least one role must be assigned' });
  }
  
  // Validar que el usuario actual tiene permiso para editar usuarios
  if (adminId) {
    const hasPermission = await checkUserPermission(adminId, 'edit_users');
    if (!hasPermission) {
      console.error('[PUT roles] ERROR: sin permisos');
      return res.status(403).json({ error: 'Permission denied: edit_users' });
    }
  }
  
  const now = new Date().toISOString();
  
  // Primero eliminar todos los roles actuales
  db.run('DELETE FROM user_roles WHERE user_id = ?', [userId], function(err) {
    if (err) {
      console.error('[PUT roles] ERROR en DELETE:', err.message);
      return res.status(500).json({ error: 'Error deleting old roles: ' + err.message });
    }
    
    console.log('[PUT roles] DELETE completado, cambios:', this.changes);
    
    // Luego asignar nuevos roles uno por uno
    let completed = 0;
    let errors = [];
    
    roles.forEach((roleId, index) => {
      const id = uuidv4();
      console.log(`[PUT roles] INSERT ${index + 1}/${roles.length}: roleId=${roleId}, userId=${userId}`);
      
      db.run(
        'INSERT INTO user_roles (id, user_id, role_id, assigned_at) VALUES (?, ?, ?, ?)',
        [id, userId, roleId, now],
        function(err) {
          if (err) {
            console.error(`[PUT roles] ERROR en INSERT ${index + 1}:`, err.message);
            errors.push(err.message);
          } else {
            console.log(`[PUT roles] INSERT ${index + 1} OK`);
          }
          
          completed++;
          
          // Si es el último, responder
          if (completed === roles.length) {
            if (errors.length > 0) {
              console.error('[PUT roles] Completado con ERRORES:', errors);
              return res.status(500).json({ error: 'Some inserts failed: ' + errors.join(', ') });
            }
            
            console.log('[PUT roles] ✓ Todos los INSERTs completados exitosamente');
            
            // Verificar que se guardaron
            db.all('SELECT * FROM user_roles WHERE user_id = ?', [userId], (err, rows) => {
              if (err) {
                console.error('[PUT roles] ERROR verificando:', err.message);
              } else {
                console.log('[PUT roles] Verificación: roles guardados en BD:', rows);
              }
              
              // Registrar en auditoría
              db.get('SELECT username FROM users WHERE id = ?', [userId], (err, user) => {
                if (user) {
                  db.run(
                    'INSERT INTO user_audit_log (id, user_id, action, description, ip_address, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
                    [uuidv4(), adminId, 'roles_updated', `Roles updated for user ${user.username}: ${roles.join(', ')}`, '127.0.0.1', now],
                    (auditErr) => {
                      if (auditErr) {
                        console.error('[PUT roles] ERROR en auditoría:', auditErr.message);
                      } else {
                        console.log('[PUT roles] ✓ Auditoría registrada');
                      }
                    }
                  );
                }
              });
              
              res.json({ 
                message: 'Roles updated successfully',
                rolesAssigned: roles.length
              });
            });
          }
        }
      );
    });
  });
});

// ==================== FASE 8: EXPORT Y COMPARTICIÓN ====================

// FASE 8.30: Enviar manual por email
app.post('/api/send-manual-email', (req, res) => {
  try {
    const { manualId, manualTitle, recipientEmail, message, senderName } = req.body;
    
    if (!recipientEmail || !manualId) {
      res.status(400).json({ error: 'Faltan parámetros requeridos' });
      return;
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      res.status(400).json({ error: 'Email inválido' });
      return;
    }
    
    // Construir URL para el manual
    const appUrl = process.env.APP_URL || 'http://localhost:8080';
    const manualUrl = `${appUrl}?manual=${manualId}`;
    
    // Template de email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b35 0%, #ff8a50 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .manual-info { background: white; border-left: 4px solid #ff6b35; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold; }
          .button:hover { background: #ff8a50; }
          .sender-message { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; border-radius: 4px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📖 Cableworld - Manual Compartido</h1>
          </div>
          <div class="content">
            <p>¡Hola!</p>
            <p><strong>${senderName}</strong> te ha compartido un manual técnico de Cableworld:</p>
            
            <div class="manual-info">
              <h2 style="margin-top: 0; color: #ff6b35;">${manualTitle}</h2>
              <p style="margin: 0; color: #666;">Accede al manual completo con todos los pasos y detalles.</p>
            </div>
            
            ${message ? `<div class="sender-message"><strong>Mensaje:</strong><br>${message}</div>` : ''}
            
            <a href="${manualUrl}" class="button">Ver Manual Completo</a>
            
            <p style="color: #666; font-size: 14px;">O copia este enlace en tu navegador:<br><code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${manualUrl}</code></p>
            
            <div class="footer">
              <p>© 2025 Cableworld - Centro de Conocimiento Técnico<br>Este manual se compartió automáticamente desde el dashboard.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Enviar email
    transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@cableworld.local',
      to: recipientEmail,
      subject: `Cableworld: Manual compartido - ${manualTitle}`,
      html: emailHtml
    }, (err, info) => {
      if (err) {
        console.error('Error enviando email:', err);
        res.status(500).json({ error: 'Error al enviar el email' });
      } else {
        console.log(`✓ Email enviado a ${recipientEmail}: ${info.response}`);
        res.json({ 
          success: true, 
          message: 'Email enviado correctamente',
          recipient: recipientEmail 
        });
      }
    });
    
  } catch (err) {
    console.error('Error en /api/send-manual-email:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== ACTIVIDAD DE USUARIOS ====================

// Update user last activity
app.post('/api/users/:userId/activity', (req, res) => {
  const now = new Date().toISOString();
  db.run(
    `UPDATE users SET last_activity = ? WHERE id = ?`,
    [now, req.params.userId],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Activity updated' });
    }
  );
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  // SECCIÓN 2.4: Health check mejorado - verifica BD también
  db.get('SELECT 1', (err) => {
    if (err) {
      res.status(500).json({ 
        status: 'ERROR', 
        message: 'Database connection failed',
        db: false,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({ 
        status: 'OK', 
        message: 'Cableworld backend is running',
        db: true,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }
  });
});

// ===== TEAMS MANAGEMENT ENDPOINTS (PROFESIONAL) =====

// GET /api/teams - Listar todos los teams del usuario
app.get('/api/teams', protectedRoute, (req, res) => {
  try {
    const userId = req.session?.user?.id;
    
    if (!userId) {
      return res.json({ data: [] });
    }
    
    // Obtener todos los teams donde el usuario es miembro
    db.all(`
      SELECT DISTINCT t.* FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      WHERE t.owner_id = ? OR tm.user_id = ?
      ORDER BY t.created_at DESC
    `, [userId, userId], (err, teams) => {
      if (err) {
        console.error('[TEAMS] Error:', err);
        return res.status(500).json({ error: 'Error loading teams' });
      }
      res.json({ data: teams || [] });
    });
  } catch (error) {
    console.error('[TEAMS] Error:', error);
    res.status(500).json({ error: 'Error loading teams' });
  }
});

// POST /api/teams - Crear nuevo team
app.post('/api/teams', (req, res) => {
  const { name, description } = req.body;
  
  // Get userId from session or use 'system' as fallback for development
  const userId = req.session?.user?.id || 'system';
  
  if (!name || name.trim().length < 3) {
    return res.status(400).json({ error: 'Team name must be at least 3 characters' });
  }
  
  const teamId = uuidv4();
  const now = new Date().toISOString();
  
  db.run(`
    INSERT INTO teams (id, name, description, owner_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [teamId, name, description || '', userId, now, now], (err) => {
    if (err) {
      console.error('[TEAMS] Error creating team:', err);
      return res.status(500).json({ error: 'Error creating team' });
    }
    
    // El dueño es automáticamente miembro (si hay sesión activa)
    if (userId !== 'system') {
      const memberId = uuidv4();
      db.run(`
        INSERT INTO team_members (id, team_id, user_id, role, added_at)
        VALUES (?, ?, ?, 'owner', ?)
      `, [memberId, teamId, userId, now], (err) => {
        if (err) {
          console.error('[TEAMS] Error adding owner as member:', err);
          // No lanzar error, el equipo ya fue creado
        }
        
        res.status(201).json({
          id: teamId,
          name,
          description,
          owner_id: userId,
          created_at: now,
          members: userId !== 'system' ? [{ id: userId, role: 'owner' }] : []
        });
      });
    } else {
      res.status(201).json({
        id: teamId,
        name,
        description,
        owner_id: userId,
        created_at: now,
        members: []
      });
    }
  });
});

// PUT /api/teams/:teamId - Editar equipo
app.put('/api/teams/:teamId', protectedRoute, (req, res) => {
  const { teamId } = req.params;
  const { name, description } = req.body;
  const userId = req.session.user.id;
  
  // Verificar que es el dueño
  db.get('SELECT owner_id FROM teams WHERE id = ?', [teamId], (err, team) => {
    if (err || !team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    if (team.owner_id !== userId) {
      return res.status(403).json({ error: 'Only owner can edit team' });
    }
    
    db.run(`
      UPDATE teams SET name = ?, description = ?, updated_at = ?
      WHERE id = ?
    `, [name || '', description || '', new Date().toISOString(), teamId], (err) => {
      if (err) {
        console.error('[TEAMS] Error updating team:', err);
        return res.status(500).json({ error: 'Error updating team' });
      }
      
      res.json({ id: teamId, name, description });
    });
  });
});

// DELETE /api/teams/:teamId - Eliminar equipo
app.delete('/api/teams/:teamId', protectedRoute, (req, res) => {
  const { teamId } = req.params;
  const userId = req.session.user.id;
  
  db.get('SELECT owner_id FROM teams WHERE id = ?', [teamId], (err, team) => {
    if (err || !team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    if (team.owner_id !== userId) {
      return res.status(403).json({ error: 'Only owner can delete team' });
    }
    
    db.run('DELETE FROM teams WHERE id = ?', [teamId], (err) => {
      if (err) {
        console.error('[TEAMS] Error deleting team:', err);
        return res.status(500).json({ error: 'Error deleting team' });
      }
      
      res.json({ message: 'Team deleted' });
    });
  });
});

// GET /api/teams/:teamId/members - Listar miembros del team
app.get('/api/teams/:teamId/members', protectedRoute, (req, res) => {
  try {
    const { teamId } = req.params;
    console.log('[GET /teams/:teamId/members] Fetching members for team:', teamId);
    
    db.all(`
      SELECT tm.id as member_id, u.id as user_id, u.name as user_name, u.email as user_email, tm.role, tm.joined_at
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
      ORDER BY tm.joined_at ASC
    `, [teamId], (err, members) => {
      if (err) {
        console.error('[GET /teams/:teamId/members] Database error:', err);
        return res.status(500).json({ error: 'Error fetching members: ' + err.message });
      }
      
      console.log('[GET /teams/:teamId/members] ✓ Found', (members || []).length, 'members');
      res.json({ data: members || [] });
    });
  } catch (err) {
    console.error('[GET /teams/:teamId/members] Catch error:', err);
    res.status(500).json({ error: 'Error: ' + err.message });
  }
});

// POST /api/teams/:teamId/members - Agregar miembro
app.post('/api/teams/:teamId/members', protectedRoute, (req, res) => {
  try {
    console.log('[POST /teams/:teamId/members] Request received');
    const { teamId } = req.params;
    const { email } = req.body;
    const userId = req.session.user.id;
    
    console.log('[POST /teams/:teamId/members] teamId:', teamId, 'email:', email, 'userId:', userId);
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Verificar permisos
    db.get(`
      SELECT t.owner_id, t.name FROM teams t
      WHERE t.id = ?
    `, [teamId], (err, team) => {
      if (err) {
        console.error('[POST /teams/:teamId/members] DB error getting team:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!team) {
        console.log('[POST /teams/:teamId/members] Team not found:', teamId);
        return res.status(404).json({ error: 'Team not found' });
      }
      
      if (team.owner_id !== userId) {
        console.log('[POST /teams/:teamId/members] Permission denied. owner_id:', team.owner_id, 'userId:', userId);
        return res.status(403).json({ error: 'Only owner can add members' });
      }
      
      console.log('[POST /teams/:teamId/members] Permission OK, team:', team.name);
      
      // Buscar usuario por email
      db.get('SELECT id FROM users WHERE email = ?', [email], (err, targetUser) => {
        if (err) {
          console.error('[POST /teams/:teamId/members] DB error finding user:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (!targetUser) {
          console.log('[POST /teams/:teamId/members] User not found for email:', email, '- sending invitation');
          // Si no existe, enviar invitación
          return sendTeamInvitation(teamId, email, res, team.name);
        }
        
        console.log('[POST /teams/:teamId/members] User found, adding as member:', targetUser.id);
        
        // Agregar como miembro directo
        const memberId = uuidv4();
        const now = new Date().toISOString();
        db.run(`
          INSERT INTO team_members (id, team_id, user_id, role, joined_at)
          VALUES (?, ?, ?, ?, ?)
        `, [memberId, teamId, targetUser.id, 'member', now], (err) => {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              console.log('[POST /teams/:teamId/members] User already a member');
              return res.status(409).json({ error: 'User is already a member' });
            }
            console.error('[POST /teams/:teamId/members] Error adding member:', err);
            return res.status(500).json({ error: 'Error adding member: ' + err.message });
          }
          
          console.log('[POST /teams/:teamId/members] ✓ Member added successfully');
          res.status(201).json({ 
            message: 'Member added',
            user_id: targetUser.id
          });
        });
      });
    });
  } catch (err) {
    console.error('[POST /teams/:teamId/members] Catch error:', err);
    res.status(500).json({ error: 'Error: ' + err.message });
  }
});

// DELETE /api/teams/:teamId/members/:memberId - Remover miembro
app.delete('/api/teams/:teamId/members/:memberId', protectedRoute, (req, res) => {
  const { teamId, memberId } = req.params;
  const userId = req.session.user.id;
  
  // Verificar permisos
  db.get('SELECT owner_id FROM teams WHERE id = ?', [teamId], (err, team) => {
    if (err || !team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    if (team.owner_id !== userId) {
      return res.status(403).json({ error: 'Only owner can remove members' });
    }
    
    db.run(`
      DELETE FROM team_members 
      WHERE team_id = ? AND user_id = ?
    `, [teamId, memberId], (err) => {
      if (err) {
        console.error('[TEAMS] Error removing member:', err);
        return res.status(500).json({ error: 'Error removing member' });
      }
      
      res.json({ message: 'Member removed' });
    });
  });
});

// POST /api/teams/:teamId/invite - Enviar invitación por correo
app.post('/api/teams/:teamId/invite', protectedRoute, (req, res) => {
  const { teamId } = req.params;
  const { email } = req.body;
  const userId = req.session.user.id;
  
  db.get('SELECT owner_id, name FROM teams WHERE id = ?', [teamId], (err, team) => {
    if (err || !team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    if (team.owner_id !== userId) {
      return res.status(403).json({ error: 'Only owner can invite members' });
    }
    
    sendTeamInvitation(teamId, email, res, team.name);
  });
});

// ===== TEAM FOLDER SHARING ENDPOINTS =====

// POST /api/teams/:teamId/share-folder - Compartir carpeta con equipo
app.post('/api/teams/:teamId/share-folder', protectedRoute, (req, res) => {
  const { teamId } = req.params;
  const { folderId, canRead, canWrite, canDelete } = req.body;
  const userId = req.session.user.id;
  
  // Verificar que es el dueño de la carpeta
  db.get('SELECT owner_id FROM folders WHERE id = ?', [folderId], (err, folder) => {
    if (err || !folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    if (folder.owner_id !== userId) {
      return res.status(403).json({ error: 'Only folder owner can share' });
    }
    
    const accessId = uuidv4();
    const now = new Date().toISOString();
    
    db.run(`
      INSERT INTO team_folder_access (id, folder_id, team_id, can_read, can_write, can_delete, granted_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [accessId, folderId, teamId, canRead ? 1 : 0, canWrite ? 1 : 0, canDelete ? 1 : 0, userId, now, now], (err) => {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Folder already shared with this team' });
        }
        console.error('[TEAMS] Error sharing folder:', err);
        return res.status(500).json({ error: 'Error sharing folder' });
      }
      
      // Registrar en auditoría
      const auditId = uuidv4();
      db.run(`
        INSERT INTO sharing_audit (id, folder_id, shared_by, shared_with_team_id, permission_type, action, new_value, created_at)
        VALUES (?, ?, ?, ?, 'team', 'share', ?, ?)
      `, [auditId, folderId, userId, teamId, JSON.stringify({ read: canRead, write: canWrite, delete: canDelete }), now], (err) => {
        if (err) console.error('[AUDIT] Error logging share:', err);
      });
      
      res.status(201).json({
        id: accessId,
        folder_id: folderId,
        team_id: teamId,
        can_read: canRead,
        can_write: canWrite,
        can_delete: canDelete
      });
    });
  });
});

// PUT /api/teams/:teamId/folder/:folderId/permissions - Actualizar permisos
app.put('/api/teams/:teamId/folder/:folderId/permissions', protectedRoute, (req, res) => {
  const { teamId, folderId } = req.params;
  const { canRead, canWrite, canDelete } = req.body;
  const userId = req.session.user.id;
  
  db.get('SELECT owner_id FROM folders WHERE id = ?', [folderId], (err, folder) => {
    if (err || !folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    if (folder.owner_id !== userId) {
      return res.status(403).json({ error: 'Only folder owner can change permissions' });
    }
    
    const now = new Date().toISOString();
    db.run(`
      UPDATE team_folder_access 
      SET can_read = ?, can_write = ?, can_delete = ?, updated_at = ?
      WHERE folder_id = ? AND team_id = ?
    `, [canRead ? 1 : 0, canWrite ? 1 : 0, canDelete ? 1 : 0, now, folderId, teamId], (err) => {
      if (err) {
        console.error('[TEAMS] Error updating permissions:', err);
        return res.status(500).json({ error: 'Error updating permissions' });
      }
      
      // Registrar en auditoría
      const auditId = uuidv4();
      db.run(`
        INSERT INTO sharing_audit (id, folder_id, shared_by, shared_with_team_id, permission_type, action, new_value, created_at)
        VALUES (?, ?, ?, ?, 'team', 'update_permissions', ?, ?)
      `, [auditId, folderId, userId, teamId, JSON.stringify({ read: canRead, write: canWrite, delete: canDelete }), now], (err) => {
        if (err) console.error('[AUDIT] Error logging permission update:', err);
      });
      
      res.json({ message: 'Permissions updated' });
    });
  });
});

// DELETE /api/teams/:teamId/folder/:folderId/revoke - Revocar acceso
app.delete('/api/teams/:teamId/folder/:folderId/revoke', protectedRoute, (req, res) => {
  const { teamId, folderId } = req.params;
  const userId = req.session.user.id;
  
  db.get('SELECT owner_id FROM folders WHERE id = ?', [folderId], (err, folder) => {
    if (err || !folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    if (folder.owner_id !== userId) {
      return res.status(403).json({ error: 'Only folder owner can revoke access' });
    }
    
    db.run(`
      DELETE FROM team_folder_access 
      WHERE folder_id = ? AND team_id = ?
    `, [folderId, teamId], (err) => {
      if (err) {
        console.error('[TEAMS] Error revoking access:', err);
        return res.status(500).json({ error: 'Error revoking access' });
      }
      
      // Registrar en auditoría
      const auditId = uuidv4();
      const now = new Date().toISOString();
      db.run(`
        INSERT INTO sharing_audit (id, folder_id, shared_by, shared_with_team_id, permission_type, action, created_at)
        VALUES (?, ?, ?, ?, 'team', 'revoke', ?)
      `, [auditId, folderId, userId, teamId, now], (err) => {
        if (err) console.error('[AUDIT] Error logging revoke:', err);
      });
      
      res.json({ message: 'Access revoked' });
    });
  });
});

// GET /api/teams/:teamId/shared-folders - Obtener carpetas compartidas con el equipo
app.get('/api/teams/:teamId/shared-folders', protectedRoute, (req, res) => {
  const { teamId } = req.params;
  
  db.all(`
    SELECT f.*, tfa.can_read, tfa.can_write, tfa.can_delete, tfa.created_at
    FROM team_folder_access tfa
    JOIN folders f ON tfa.folder_id = f.id
    WHERE tfa.team_id = ?
    ORDER BY f.name ASC
  `, [teamId], (err, folders) => {
    if (err) {
      console.error('[TEAMS] Error fetching shared folders:', err);
      return res.status(500).json({ error: 'Error fetching folders' });
    }
    
    res.json(folders || []);
  });
});

// ===== SHARING SEARCH & HISTORY ENDPOINTS =====

// GET /api/shared-with-me - Buscar carpetas compartidas conmigo
app.get('/api/shared-with-me', (req, res) => {
  try {
    const userId = req.session?.user?.id;
    
    if (!userId) {
      // Si no hay sesión, devolver array vacío
      return res.json([]);
    }
    
    // Devolver un array vacío por ahora
    // TODO: Implementar cuando las tablas folder_access y team_folder_access estén disponibles
    res.json([]);
  } catch (error) {
    console.error('[SHARED-WITH-ME] Error:', error);
    res.status(500).json({ error: 'Error loading shared folders' });
  }
});

// GET /api/sharing-history/:folderId - Historial de comparticiones de una carpeta
app.get('/api/sharing-history/:folderId', protectedRoute, (req, res) => {
  const { folderId } = req.params;
  const userId = req.session.user.id;
  
  // Verificar permiso
  db.get('SELECT owner_id FROM folders WHERE id = ?', [folderId], (err, folder) => {
    if (err || !folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    if (folder.owner_id !== userId) {
      return res.status(403).json({ error: 'Only folder owner can view sharing history' });
    }
    
    db.all(`
      SELECT s.*, 
        u.name as shared_by_name,
        u2.name as shared_with_name,
        t.name as shared_with_team
      FROM sharing_audit s
      LEFT JOIN users u ON s.shared_by = u.id
      LEFT JOIN users u2 ON s.shared_with_user_id = u2.id
      LEFT JOIN teams t ON s.shared_with_team_id = t.id
      WHERE s.folder_id = ?
      ORDER BY s.created_at DESC
      LIMIT 500
    `, [folderId], (err, history) => {
      if (err) {
        console.error('[HISTORY] Error fetching history:', err);
        return res.status(500).json({ error: 'Error fetching history' });
      }
      
      res.json(history || []);
    });
  });
});

// ===== HELPER FUNCTIONS =====

function sendTeamInvitation(teamId, email, res, teamName = '') {
  const invitationId = uuidv4();
  const token = uuidv4();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 días
  
  db.run(`
    INSERT INTO team_invitations (id, team_id, email, token, status, created_at, expires_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?)
  `, [invitationId, teamId, email, token, now, expiresAt], (err) => {
    if (err) {
      console.error('[TEAMS] Error creating invitation:', err);
      return res.status(500).json({ error: 'Error sending invitation' });
    }
    
    // Enviar email
    const inviteUrl = `${process.env.APP_URL || 'http://localhost:5000'}/accept-team-invite?token=${token}`;
    const emailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold; }
          .button:hover { background: #764ba2; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 Invitación a Equipo Cableworld</h1>
          </div>
          <div class="content">
            <p>¡Hola!</p>
            <p>Has sido invitado a unirte al equipo <strong>"${teamName}"</strong> en Cableworld Knowledge Base Manager.</p>
            <p>Haz clic en el botón de abajo para aceptar la invitación:</p>
            <a href="${inviteUrl}" class="button">Aceptar Invitación</a>
            <p style="color: #666; font-size: 14px;">O copia este enlace: <code style="background: #f0f0f0; padding: 2px 6px;">${inviteUrl}</code></p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">Esta invitación expira en 7 días.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Invitación a unirte al equipo "${teamName}"`,
      html: emailTemplate
    }, (err) => {
      if (err) {
        console.error('[EMAIL] Error sending team invitation:', err);
        return res.status(500).json({ error: 'Error sending invitation email' });
      }
      
      res.status(201).json({
        message: 'Invitation sent',
        id: invitationId,
        email,
        status: 'pending'
      });
    });
  });
}

// Start server
// SECCIÓN 2.3: Run migrations before starting server, then initialize database
// SECCIÓN 1.3: Initialize Redis for rate limiting
runMigrations().then(async () => {
  initializeDatabase(() => {
    // Database is ready, now start the server
    app.listen(PORT, () => {
      console.log(`\n🚀 Cableworld Backend corriendo en http://localhost:${PORT}`);
      console.log(`📊 Base de datos: ${dbPath}`);
      console.log(`\n API disponible en http://localhost:${PORT}/api\n`);
    });
    
    // Create default roles and admin user after DB is ready
    createDefaultRolesAndAdmin().then(() => {
      console.log('✓ Roles y admin user check completado');
    });
  });
});

// Global error handlers for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n❌ UNCAUGHT EXCEPTION:', error.message);
  console.error('Full error:', error);
  console.error(error.stack);
  // Gracefully close and exit
  db.close((err) => {
    console.log('✓ Base de datos cerrada');
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ UNHANDLED REJECTION:', reason);
  console.error('Promise:', promise);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Cerrando servidor...');
  db.close((err) => {
    if (err) console.error(err);
    else console.log('✓ Base de datos cerrada');
    process.exit(0);
  });
});
