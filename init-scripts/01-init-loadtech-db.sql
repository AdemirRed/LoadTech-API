-- Script de inicialização do banco LoadTech
-- Este script é executado automaticamente quando o container PostgreSQL é criado

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Criar schema para separar dados do sistema
CREATE SCHEMA IF NOT EXISTS loadtech;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS logs;

-- Função para gerar slugs únicos
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(
                unaccent(input_text), 
                '[^a-zA-Z0-9\s]', '', 'g'
            ), 
            '\s+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar usuário para aplicação (com permissões limitadas)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'loadtech_app') THEN
        CREATE ROLE loadtech_app WITH LOGIN PASSWORD 'LoadTech@App2025!';
    END IF;
END
$$;

-- Conceder permissões necessárias
GRANT USAGE ON SCHEMA loadtech TO loadtech_app;
GRANT USAGE ON SCHEMA analytics TO loadtech_app;
GRANT USAGE ON SCHEMA logs TO loadtech_app;

GRANT CREATE ON SCHEMA loadtech TO loadtech_app;
GRANT CREATE ON SCHEMA analytics TO loadtech_app;
GRANT CREATE ON SCHEMA logs TO loadtech_app;

-- Configurações de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.7;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Log de inicialização
INSERT INTO pg_catalog.pg_settings (name, setting) 
VALUES ('log_statement', 'all') 
ON CONFLICT (name) DO UPDATE SET setting = EXCLUDED.setting;

-- Criar tabela de logs de sistema
CREATE TABLE IF NOT EXISTS logs.system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON logs.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON logs.system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_metadata ON logs.system_logs USING GIN(metadata);

-- Log de inicialização bem-sucedida
INSERT INTO logs.system_logs (level, message, metadata) 
VALUES (
    'INFO', 
    'LoadTech Master Database initialized successfully',
    jsonb_build_object(
        'timestamp', CURRENT_TIMESTAMP,
        'version', '1.0.0',
        'environment', 'development'
    )
);
