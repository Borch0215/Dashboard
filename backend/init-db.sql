-- Create manuals table
CREATE TABLE IF NOT EXISTS manuals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  role TEXT,
  type TEXT,
  summary TEXT,
  version TEXT,
  lastUpdated TEXT,
  tags TEXT,
  content TEXT,
  versions TEXT,
  folder_id TEXT,
  is_obsolete BOOLEAN DEFAULT 0,
  marked_reviewed TEXT,
  is_favorite BOOLEAN DEFAULT 0,
  folder_order INTEGER DEFAULT 0,
  access_level TEXT DEFAULT 'public',
  last_accessed TEXT,
  createdAt TEXT,
  updatedAt TEXT,
  deleted_at TEXT,
  created_by TEXT,
  is_private BOOLEAN DEFAULT 0
);

-- Create folders table with created_by and access_level
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id TEXT,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#3498db',
  order_index INTEGER DEFAULT 0,
  created_by TEXT,
  access_level TEXT DEFAULT 'private',
  team_id TEXT,
  createdAt TEXT,
  updatedAt TEXT,
  is_favorite BOOLEAN DEFAULT 0,
  tags TEXT DEFAULT '',
  owner_id TEXT,
  permissions TEXT DEFAULT '{}',
  shared_with TEXT DEFAULT '{}',
  folder_type TEXT DEFAULT 'standard',
  settings TEXT DEFAULT '{}',
  thumbnail_path TEXT,
  manual_count INTEGER DEFAULT 0,
  total_size_kb INTEGER DEFAULT 0,
  last_modified TEXT,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT UNIQUE,
  name TEXT,
  firstName TEXT,
  lastName TEXT,
  department TEXT,
  role TEXT,
  roleName TEXT,
  passwordSet BOOLEAN DEFAULT 0,
  status TEXT DEFAULT 'active',
  lastLogin TEXT,
  last_activity TEXT,
  specialties TEXT DEFAULT '[]',
  createdAt TEXT,
  updatedAt TEXT,
  deleted_at TEXT
);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions TEXT DEFAULT '{}',
  is_default BOOLEAN DEFAULT 0,
  createdAt TEXT,
  updatedAt TEXT
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  assigned_at TEXT,
  createdAt TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Create diagrams table
CREATE TABLE IF NOT EXISTS diagrams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  rootNodeId TEXT,
  nodes TEXT,
  data TEXT,
  parentCategory TEXT DEFAULT 'GPON',
  subcategory TEXT DEFAULT 'Internet',
  version_number INTEGER DEFAULT 0,
  deleted_at TEXT,
  createdAt TEXT,
  updatedAt TEXT
);

-- Create manual_versions table
CREATE TABLE IF NOT EXISTS manual_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manual_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  editor_user_id TEXT,
  editor_username TEXT,
  changed_fields TEXT,
  change_reason TEXT DEFAULT 'edited',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manual_id) REFERENCES manuals(id),
  UNIQUE(manual_id, version_number)
);

-- Create diagram_versions table
CREATE TABLE IF NOT EXISTS diagram_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diagram_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  data_structure TEXT NOT NULL,
  editor_user_id TEXT,
  editor_username TEXT,
  changed_fields TEXT,
  change_reason TEXT DEFAULT 'edited',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (diagram_id) REFERENCES diagrams(id),
  UNIQUE(diagram_id, version_number)
);

-- Create diagram_nodes table
CREATE TABLE IF NOT EXISTS diagram_nodes (
  id TEXT PRIMARY KEY,
  diagram_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  node_type TEXT,
  label TEXT,
  description TEXT,
  position_x INTEGER,
  position_y INTEGER,
  metadata TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(diagram_id) REFERENCES diagrams(id),
  UNIQUE(diagram_id, node_id)
);

-- Create diagram_edges table
CREATE TABLE IF NOT EXISTS diagram_edges (
  id TEXT PRIMARY KEY,
  diagram_id TEXT NOT NULL,
  edge_id TEXT NOT NULL,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  edge_type TEXT,
  label TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(diagram_id) REFERENCES diagrams(id),
  UNIQUE(diagram_id, edge_id)
);

-- Create diagram_migration table
CREATE TABLE IF NOT EXISTS diagram_migration (
  diagram_id TEXT PRIMARY KEY,
  migrated_at TEXT,
  migration_status TEXT,
  error_message TEXT
);

-- Create progress table
CREATE TABLE IF NOT EXISTS progress (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  manualId TEXT NOT NULL,
  stepIndex INTEGER,
  completed BOOLEAN,
  timestamp TEXT,
  UNIQUE(userId, manualId, stepIndex)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  manualId TEXT NOT NULL,
  text TEXT,
  timestamp TEXT
);

-- Create history table
CREATE TABLE IF NOT EXISTS history (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  manualId TEXT,
  diagramId TEXT,
  action TEXT,
  timestamp TEXT
);

-- Create user_audit_log table
CREATE TABLE IF NOT EXISTS user_audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  ip_address TEXT,
  changed_fields TEXT,
  createdAt TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create folder_permissions table
CREATE TABLE IF NOT EXISTS folder_permissions (
  id TEXT PRIMARY KEY,
  folder_id TEXT NOT NULL,
  user_id TEXT,
  permission_type TEXT,
  access_level TEXT,
  granted_by TEXT,
  granted_at TEXT,
  FOREIGN KEY (folder_id) REFERENCES folders(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create folder_shares table
CREATE TABLE IF NOT EXISTS folder_shares (
  id TEXT PRIMARY KEY,
  folder_id TEXT NOT NULL,
  shared_with_user_id TEXT,
  shared_with_team_id TEXT,
  permission_level TEXT DEFAULT 'viewer',
  shared_by TEXT NOT NULL,
  shared_at TEXT,
  expires_at TEXT,
  FOREIGN KEY (folder_id) REFERENCES folders(id),
  FOREIGN KEY (shared_with_user_id) REFERENCES users(id),
  FOREIGN KEY (shared_with_team_id) REFERENCES teams(id)
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TEXT,
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL,
  permission TEXT NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Create folder_audit_log table
CREATE TABLE IF NOT EXISTS folder_audit_log (
  id TEXT PRIMARY KEY,
  folder_id TEXT NOT NULL,
  action TEXT NOT NULL,
  changed_fields TEXT,
  created_by TEXT,
  createdAt TEXT,
  FOREIGN KEY (folder_id) REFERENCES folders(id)
);

-- Create fts_manuals virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS fts_manuals USING fts5(
  id, title, content, category, role, type
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_manuals_folder ON manuals(folder_id);
CREATE INDEX IF NOT EXISTS idx_manuals_obsolete ON manuals(is_obsolete);
CREATE INDEX IF NOT EXISTS idx_manuals_deleted_at ON manuals(deleted_at);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_favorite ON folders(is_favorite);
CREATE INDEX IF NOT EXISTS idx_folders_access ON folders(access_level);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_folder_permissions_folder_id ON folder_permissions(folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_permissions_user_id ON folder_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_folder_shares_folder_id ON folder_shares(folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_shares_user_id ON folder_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_folder_shares_team_id ON folder_shares(shared_with_team_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON user_audit_log(createdAt);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_diagrams_deleted_at ON diagrams(deleted_at);
CREATE INDEX IF NOT EXISTS idx_manual_versions_manual_id ON manual_versions(manual_id);
CREATE INDEX IF NOT EXISTS idx_manual_versions_created_at ON manual_versions(created_at);
CREATE INDEX IF NOT EXISTS idx_diagram_versions_diagram_id ON diagram_versions(diagram_id);
CREATE INDEX IF NOT EXISTS idx_diagram_versions_created_at ON diagram_versions(created_at);
CREATE INDEX IF NOT EXISTS idx_diagram_nodes_diagram_id ON diagram_nodes(diagram_id);
CREATE INDEX IF NOT EXISTS idx_diagram_nodes_type ON diagram_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_diagram_nodes_created_at ON diagram_nodes(created_at);
CREATE INDEX IF NOT EXISTS idx_diagram_edges_diagram_id ON diagram_edges(diagram_id);
CREATE INDEX IF NOT EXISTS idx_diagram_edges_source ON diagram_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_diagram_edges_target ON diagram_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_diagram_edges_created_at ON diagram_edges(created_at);
-- ======== MIGRATION PHASE 9: Add Missing Columns for Permission System ========

-- Create manual_shares table for explicit sharing of private manuals
CREATE TABLE IF NOT EXISTS manual_shares (
  id TEXT PRIMARY KEY,
  manual_id TEXT NOT NULL,
  shared_with_user_id TEXT,
  shared_with_team_id TEXT,
  permission_level TEXT DEFAULT 'viewer',
  shared_by TEXT NOT NULL,
  shared_at TEXT,
  FOREIGN KEY (manual_id) REFERENCES manuals(id),
  FOREIGN KEY (shared_with_user_id) REFERENCES users(id),
  FOREIGN KEY (shared_with_team_id) REFERENCES teams(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_manual_shares_manual_id ON manual_shares(manual_id);
CREATE INDEX IF NOT EXISTS idx_manual_shares_user_id ON manual_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_manual_shares_team_id ON manual_shares(shared_with_team_id);