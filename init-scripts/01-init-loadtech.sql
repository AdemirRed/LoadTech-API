-- Script de inicialização do banco de dados LoadTech
-- Este script é executado automaticamente quando o container do PostgreSQL é criado

-- Criar schema loadtech se não existir
CREATE SCHEMA IF NOT EXISTS loadtech;

-- Configurar timezone
SET timezone = 'America/Sao_Paulo';

-- Criar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Definir search_path padrão
ALTER DATABASE loadtech_master SET search_path TO loadtech, public;

-- Criar usuário adicional para desenvolvimento (opcional)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'loadtech_dev') THEN
        CREATE ROLE loadtech_dev LOGIN PASSWORD 'dev123';
        GRANT CONNECT ON DATABASE loadtech_master TO loadtech_dev;
        GRANT USAGE ON SCHEMA loadtech TO loadtech_dev;
        GRANT CREATE ON SCHEMA loadtech TO loadtech_dev;
    END IF;
END
$$;

-- Configurar permissões
GRANT ALL PRIVILEGES ON SCHEMA loadtech TO loadtech_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA loadtech TO loadtech_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA loadtech TO loadtech_admin;

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION loadtech.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Log de inicialização
INSERT INTO pg_stat_statements_info (dealloc) VALUES (0) ON CONFLICT DO NOTHING;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'LoadTech Master Database inicializado com sucesso!';
    RAISE NOTICE 'Schema: loadtech';
    RAISE NOTICE 'Database: loadtech_master';
    RAISE NOTICE 'Timezone: America/Sao_Paulo';
END
$$;
