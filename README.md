# 🚀 LoadTech API - Sistema SaaS de E-commerce

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/license-MIT-blue)

API backend completa para o sistema SaaS LoadTech - uma plataforma de e-commerce similar ao Mercado Livre, Shopee e AliExpress, desenvolvida com Node.js, Express, PostgreSQL e Redis.

## 📋 Índice

- [Características](#características)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [API Endpoints](#api-endpoints)
- [Planos Disponíveis](#planos-disponíveis)
- [Docker](#docker)
- [Contribuição](#contribuição)

## ✨ Características

### 🔐 Autenticação e Autorização
- Sistema completo de registro de usuários
- Verificação de e-mail obrigatória
- Recuperação de senha por e-mail
- JWT para autenticação
- Middleware de autorização por papel (admin/usuário)

### 💳 Sistema de Planos e Assinaturas
- **4 Planos Disponíveis**: Gratuito, Básico, Profissional, Enterprise
- Períodos de teste gratuito configuráveis
- Cobrança mensal e anual com descontos
- Upgrade/downgrade de planos
- Gestão completa de assinaturas

### 🏪 Sistema de Lojas
- Criação de lojas personalizadas
- Slugs únicos para URLs amigáveis
- Personalização de tema (cores)
- Configurações de SEO
- Domínios personalizados (planos superiores)
- Múltiplas opções de pagamento

### 💰 Gestão de Pagamentos
- Integração com múltiplos gateways
- Histórico completo de transações
- Webhooks para atualizações automáticas
- Suporte a PIX, cartões e boleto

### 📊 Analytics e Relatórios
- Dashboard administrativo
- Estatísticas por plano
- Métricas de conversão
- Logs detalhados do sistema

## 🛠 Tecnologias

### Backend
- **Node.js 18+** - Runtime JavaScript
- **Express.js** - Framework web
- **Sequelize** - ORM para banco de dados
- **PostgreSQL 15** - Banco de dados principal
- **Redis 7** - Cache e sessões

### Autenticação & Segurança
- **JWT** - JSON Web Tokens
- **bcryptjs** - Hash de senhas
- **Yup** - Validação de dados
- **Rate Limiting** - Proteção contra spam

### E-mail & Comunicação
- **Nodemailer** - Envio de e-mails
- **WebSocket** - Comunicação em tempo real

### DevOps & Containerização
- **Docker & Docker Compose** - Containerização
- **ESLint & Prettier** - Qualidade de código
- **Nodemon** - Desenvolvimento

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
- [Git](https://git-scm.com/)

**OU** se preferir instalação local:
- [PostgreSQL 15+](https://www.postgresql.org/)
- [Redis 7+](https://redis.io/)

## 🚀 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/LoadTech-API.git
cd LoadTech-API
```

### 2. Configuração com Docker (Recomendado)

```bash
# Copiar arquivo de configuração
cp .env.example .env

# Iniciar todos os serviços
docker-compose up -d

# Executar migrations
docker-compose exec app npx sequelize-cli db:migrate

# Verificar se tudo está funcionando
docker-compose logs -f app
```

### 3. Instalação Local (Alternativa)

```bash
# Instalar dependências
npm install

# Copiar arquivo de configuração
cp .env.example .env

# Configurar banco de dados local
# (Edite o arquivo .env com suas configurações)

# Executar migrations
npx sequelize-cli db:migrate

# Iniciar servidor de desenvolvimento
npm run dev
```

## ⚙️ Configuração

### Variáveis de Ambiente

Edite o arquivo `.env` com suas configurações:

```env
# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=loadtech_admin
DB_PASSWORD=LoadTech@2025!
DB_DATABASE=loadtech_master

# E-mail (Gmail exemplo)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app

# JWT
JWT_SECRET=seu-jwt-secret-muito-seguro

# Pagamentos
MP_PUBLIC_KEY=seu-mercadopago-public-key
MP_ACCESS_TOKEN=seu-mercadopago-access-token
```

### Configuração de E-mail

Para o Gmail, você precisa:
1. Ativar verificação em 2 etapas
2. Gerar uma senha de app específica
3. Usar essa senha no `EMAIL_PASS`

## 🎯 Uso

### Iniciar Servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

A API estará disponível em `http://localhost:3001`

### Serviços Auxiliares

- **PgAdmin**: `http://localhost:8080` (admin@loadtech.com / LoadTech@Admin2025)
- **Redis**: `localhost:6379`
- **Mailcatcher** (dev): `http://localhost:1080`

## 📁 Estrutura do Projeto

```
LoadTech-API/
├── src/
│   ├── app/
│   │   ├── controllers/     # Controladores da API
│   │   ├── middlewares/     # Middlewares personalizados
│   │   └── models/          # Modelos do Sequelize
│   ├── config/             # Configurações
│   ├── database/           # Migrations e seeds
│   ├── utils/              # Utilitários
│   ├── app.js             # Configuração da aplicação
│   ├── routes.js          # Definição das rotas
│   └── server.js          # Servidor principal
├── init-scripts/          # Scripts de inicialização do DB
├── docker-compose.yml     # Compose para produção
├── docker-compose.dev.yml # Compose para desenvolvimento
└── README.md
```

## 📡 API Endpoints

### Autenticação
```http
POST /cadastro              # Registrar usuário
POST /login                 # Login
POST /verificar-email       # Verificar e-mail
POST /esqueci-senha         # Recuperar senha
POST /redefinir-senha       # Redefinir senha
```

### Usuários
```http
GET  /usuario              # Dados do usuário
PUT  /usuario              # Atualizar usuário
```

### Planos
```http
GET  /planos               # Listar planos
GET  /planos/:id           # Detalhes do plano
GET  /planos/comparar      # Comparar planos
```

### Assinaturas
```http
GET  /assinaturas          # Listar assinaturas
GET  /assinatura/atual     # Assinatura ativa
POST /assinaturas          # Criar assinatura
PUT  /assinaturas/:id/cancelar # Cancelar
```

### Lojas
```http
GET  /minha-loja           # Dados da loja
POST /loja                 # Criar loja
PUT  /loja                 # Atualizar loja
PUT  /loja/tema            # Personalizar tema
```

### Administrativo
```http
GET  /admin/planos/stats   # Estatísticas
GET  /admin/assinaturas    # Todas assinaturas
GET  /admin/lojas          # Todas lojas
```

## 💎 Planos Disponíveis

| Plano | Preço/Mês | Produtos | Vendas/Mês | Taxa | Teste |
|-------|------------|----------|------------|------|-------|
| **Gratuito** | R$ 0 | 10 | 50 | 4.99% | - |
| **Básico** | R$ 29,90 | 100 | 500 | 2.99% | 7 dias |
| **Profissional** | R$ 59,90 | 1.000 | 5.000 | 2.49% | 14 dias |
| **Enterprise** | R$ 149,90 | Ilimitado | Ilimitado | 1.99% | 30 dias |

## 🐳 Docker

### Comandos Úteis

```bash
# Desenvolvimento
docker-compose -f docker-compose.dev.yml up -d

# Produção
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Executar migrations
docker-compose exec app npx sequelize-cli db:migrate

# Acessar container
docker-compose exec app sh

# Backup do banco
docker-compose exec postgres pg_dump -U loadtech_admin loadtech_master > backup.sql

# Parar todos os serviços
docker-compose down
```

### Volumes

- `postgres_master_data`: Dados do PostgreSQL
- `redis_data`: Dados do Redis
- `pgadmin_data`: Configurações do PgAdmin
- `uploads`: Arquivos enviados pelos usuários

## 🔧 Desenvolvimento

### Scripts NPM

```bash
npm run dev        # Servidor desenvolvimento
npm run lint       # Verificar código
npm run format     # Formatar código
npm test           # Executar testes
npm run build      # Build para produção
```

### Migrations

```bash
# Criar nova migration
npx sequelize-cli migration:generate --name nome-da-migration

# Executar migrations
npx sequelize-cli db:migrate

# Reverter última migration
npx sequelize-cli db:migrate:undo
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes com coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

## 📈 Monitoramento

### Logs

Os logs são salvos em:
- Console (desenvolvimento)
- Arquivo `logs/loadtech.log` (produção)
- Banco de dados (tabela `logs.system_logs`)

### Métricas

- Health check: `GET /health`
- Métricas: `GET /metrics`
- Status: `GET /status`

## 🚀 Deploy

### Heroku

```bash
# Login no Heroku
heroku login

# Criar app
heroku create loadtech-api

# Configurar variáveis
heroku config:set NODE_ENV=production
heroku config:set DB_HOST=seu-db-host

# Deploy
git push heroku main
```

### AWS/Digital Ocean

1. Configure um servidor Ubuntu 20.04+
2. Instale Docker e Docker Compose
3. Clone o repositório
4. Configure as variáveis de ambiente
5. Execute `docker-compose up -d`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### Padrões de Código

- Use ESLint e Prettier
- Siga os padrões de nomenclatura existentes
- Escreva testes para novas funcionalidades
- Documente mudanças significativas

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Equipe

- **Ademir/RedBlack** - Desenvolvedor Principal
- Email: ademir1de1oliveira@gmail.com
- WhatsApp: [+55 51 99775-6708](https://wa.me/5551997756708)

## 🆘 Suporte

- 📧 Email: suporte@loadtech.com
- 📱 WhatsApp: [+55 51 99775-6708](https://wa.me/5551997756708)
- 📖 Documentação: [docs.loadtech.com](https://docs.loadtech.com)
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/LoadTech-API/issues)

---

**LoadTech** - Transformando ideias em vendas! 🚀
