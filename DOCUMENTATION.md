# LoadTech API - Sistema SaaS Completo ✨

Uma API robusta para sistema SaaS de e-commerce com funcionalidades completas de gestão de usuários, planos, assinaturas e lojas.

## 🎯 Status do Projeto

✅ **Banco de Dados Master**: Configurado e funcionando  
✅ **Migrations**: Executadas com sucesso  
✅ **Sistema de Usuários**: Implementado  
✅ **Sistema de Planos**: 4 planos criados  
✅ **Sistema de Assinaturas**: Funcional  
✅ **Sistema de Lojas**: Implementado  
✅ **API Endpoints**: 23 rotas criadas  

## 🗄️ Banco de Dados

### Estrutura Criada

O sistema usa PostgreSQL com as seguintes tabelas:

1. **users** - Gestão de usuários
2. **planos** - Planos de assinatura
3. **assinaturas** - Controle de assinaturas
4. **lojas** - Lojas dos usuários
5. **pagamentos** - Histórico de transações

### Containers Docker Ativos

```
✅ loadtech-master-db   (PostgreSQL 15)    - Porta 5433
✅ loadtech-redis       (Redis 7)          - Porta 6379  
✅ loadtech-pgadmin     (PgAdmin 4)        - Porta 8080
```

## 📊 Planos Disponíveis

| Plano | Preço | Produtos | Vendas/Mês | Taxa | Período Gratuito |
|-------|-------|----------|------------|------|------------------|
| **Gratuito** | R$ 0,00 | 10 | 50 | 4,99% | - |
| **Básico** | R$ 29,90 | 100 | 500 | 2,99% | 7 dias |
| **Profissional** | R$ 59,90 | 1.000 | 5.000 | 2,49% | 14 dias ⭐ |
| **Enterprise** | R$ 149,90 | ∞ | ∞ | 1,99% | 30 dias |

## 🚀 Iniciar o Servidor

```bash
# 1. Certificar que os containers estão rodando
docker-compose ps

# 2. Instalar dependências (se ainda não fez)
npm install

# 3. Iniciar servidor de desenvolvimento
npm run dev
```

**API estará disponível em:** `http://localhost:3001`

## 📋 Endpoints Implementados

### 🔓 Rotas Públicas (Sem Autenticação)

```http
POST   /cadastro                  # Cadastrar novo usuário
POST   /login                     # Fazer login
POST   /verificar-email           # Verificar código de e-mail
POST   /reenviar-codigo           # Reenviar código de verificação
POST   /esqueci-senha             # Solicitar recuperação de senha
POST   /redefinir-senha           # Redefinir senha
GET    /planos                    # Listar planos disponíveis
GET    /planos/:id                # Detalhes de um plano
GET    /planos/comparar           # Comparar planos
GET    /loja/:slug                # Visualizar loja pública
```

### 🔒 Rotas Protegidas (Requer Token JWT)

```http
# Usuário
GET    /usuario                   # Dados do usuário logado
PUT    /usuario                   # Atualizar dados do usuário

# Assinaturas
GET    /assinaturas               # Listar assinaturas do usuário
GET    /assinatura/atual          # Assinatura ativa atual
POST   /assinaturas               # Criar nova assinatura
PUT    /assinaturas/:id/cancelar  # Cancelar assinatura
PUT    /assinaturas/:id/alterar-plano    # Alterar plano
PUT    /assinaturas/:id/reativar  # Reativar assinatura

# Loja
GET    /minha-loja                # Dados da loja do usuário
POST   /loja                      # Criar nova loja
PUT    /loja                      # Atualizar dados da loja
PUT    /loja/tema                 # Alterar tema da loja
PUT    /loja/seo                  # Configurar SEO
PUT    /loja/pagamentos           # Configurar métodos de pagamento
PUT    /loja/status               # Ativar/Desativar loja
```

### 👨‍💼 Rotas Administrativas (Requer Papel Admin)

```http
# Gestão de Planos
POST   /admin/planos              # Criar novo plano
PUT    /admin/planos/:id          # Atualizar plano
DELETE /admin/planos/:id          # Excluir plano
GET    /admin/planos/stats        # Estatísticas dos planos

# Relatórios
GET    /admin/assinaturas         # Listar todas assinaturas
GET    /admin/lojas               # Listar todas lojas
```

## 🧪 Testando a API

### 1. Cadastrar Usuário

```bash
curl -X POST http://localhost:3001/cadastro \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@teste.com", 
    "senha": "123456",
    "telefone": "(11) 99999-9999"
  }'
```

### 2. Verificar E-mail

```bash
curl -X POST http://localhost:3001/verificar-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@teste.com",
    "codigo": "123456"
  }'
```

### 3. Fazer Login

```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@teste.com",
    "senha": "123456"
  }'
```

### 4. Listar Planos

```bash
curl -X GET http://localhost:3001/planos
```

### 5. Criar Loja (Com Token)

```bash
curl -X POST http://localhost:3001/loja \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome_loja": "Minha Loja",
    "descricao": "A melhor loja online",
    "telefone_loja": "(11) 3333-3333"
  }'
```

## 🔧 Administração do Banco

### PgAdmin Web
- **URL**: http://localhost:8080
- **Email**: admin@loadtech.com  
- **Senha**: LoadTech@Admin2025

### Conexão Direta PostgreSQL
```bash
# Via Docker
docker exec -it loadtech-master-db psql -U loadtech_admin -d loadtech_master

# Via cliente externo
Host: localhost
Port: 5433
Database: loadtech_master
Username: loadtech_admin
Password: LoadTech@2025!
Schema: loadtech
```

## 📁 Estrutura dos Models

```
src/app/models/
├── User.js          # Usuários do sistema
├── Plano.js         # Planos de assinatura  
├── Assinatura.js    # Assinaturas dos usuários
├── Loja.js          # Lojas dos usuários
└── Pagamento.js     # Histórico de pagamentos
```

## 🔐 Autenticação

O sistema usa **JWT (JSON Web Token)** para autenticação:

1. Faça login para receber o token
2. Inclua o token no header: `Authorization: Bearer {token}`
3. O token expira em 7 dias por padrão

## 🎨 Funcionalidades das Lojas

- ✅ Criação automática de slug único
- ✅ Temas personalizáveis (cores)
- ✅ Configurações de SEO
- ✅ Suporte a domínio personalizado
- ✅ Múltiplos gateways de pagamento
- ✅ Status ativo/inativo/suspenso

## 💳 Sistema de Assinaturas

- ✅ Períodos mensais e anuais
- ✅ Período gratuito por plano
- ✅ Auto-renovação configurável
- ✅ Cancelamento e reativação
- ✅ Upgrade/downgrade de planos

## 🚧 Próximos Passos

1. **Sistema de Produtos** - CRUD de produtos para as lojas
2. **Carrinho de Compras** - Funcionalidade de compra
3. **Gestão de Pedidos** - Controle de vendas
4. **Dashboard Analytics** - Relatórios e métricas
5. **Integração Gateways** - Mercado Pago, PagSeguro, etc.

## 📞 Suporte

**Desenvolvedor**: RedBlack/Ademir  
**WhatsApp**: [+55 51 99775-6708](https://wa.me/5551997756708)  
**Email**: ademir1de1oliveira@gmail.com

---

🎉 **API LoadTech pronta para desenvolvimento!**
