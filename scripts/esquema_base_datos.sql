-- 1. Tabla de Empresas
CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);
CREATE INDEX ix_empresas_nombre ON empresas(nombre);

-- 2. Tabla de Aplicaciones
CREATE TABLE aplicaciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);
CREATE INDEX ix_aplicaciones_nombre ON aplicaciones(nombre);

-- 3. Tabla Relacional Entre Empresa y Aplicación (N:M)
CREATE TABLE empresa_aplicacion (
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    aplicacion_id INTEGER NOT NULL REFERENCES aplicaciones(id) ON DELETE CASCADE,
    PRIMARY KEY (empresa_id, aplicacion_id)
);

-- 4. Tabla de Categorías
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL
);
CREATE INDEX ix_categorias_nombre ON categorias(nombre);

-- 5. Tabla de Productos (Servicios dependientes de categorías)
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) UNIQUE NOT NULL,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL
);
CREATE INDEX ix_productos_nombre ON productos(nombre);

-- 6. Tabla de Usuarios (Autenticación y Roles)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(200) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE SET NULL
);
CREATE INDEX ix_usuarios_username ON usuarios(username);
CREATE INDEX ix_usuarios_email ON usuarios(email);

-- Creamos el Administrador por Defecto (Clave: admin123)
-- El hash corresponde a bcrypt salt genérico para "admin123"
INSERT INTO usuarios (username, email, hashed_password, rol) 
VALUES ('admin', 'admin@localhost', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin');

-- 7. Tabla Histórica de Incidentes (Bitácora)
CREATE TABLE incidentes (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    aplicacion_id INTEGER NOT NULL REFERENCES aplicaciones(id) ON DELETE CASCADE,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
    fecha_inicio TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    duracion_minutos DOUBLE PRECISION NOT NULL,
    motivo TEXT,
    solucion TEXT,
    ticket VARCHAR(100),
    mes_reporte VARCHAR(50) NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_registro TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_incidentes_mes_reporte ON incidentes(mes_reporte);
