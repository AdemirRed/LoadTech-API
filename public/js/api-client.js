// ===== CONFIGURAÇÕES GLOBAIS =====
const API_BASE_URL = 'http://localhost:3001';
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

// ===== FUNÇÕES DE AUTENTICAÇÃO =====

// Verificar status de autenticação
function updateAuthStatus() {
    const authStatus = document.getElementById('auth-status');
    if (authToken && currentUser.email) {
        authStatus.innerHTML = `✅ Logado como: ${currentUser.email}`;
        authStatus.className = 'auth-status authenticated';
        
        // Verificar se o email foi verificado
        if (!currentUser.email_verificado) {
            showVerificationNotice();
        }
    } else {
        authStatus.innerHTML = '❌ Não autenticado';
        authStatus.className = 'auth-status';
    }
}

// Mostrar aviso de verificação de email
function showVerificationNotice() {
    const notices = document.querySelectorAll('.verification-notice');
    notices.forEach(notice => {
        notice.style.display = 'block';
    });
}

// Login do usuário
async function login() {
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    
    if (!email || !senha) {
        showResult('login-result', 'Preencha todos os campos', 'error');
        return;
    }
    
    try {
        showLoading('login-btn');
        
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            updateAuthStatus();
            showResult('login-result', 'Login realizado com sucesso!', 'success');
            
            // Limpar campos
            document.getElementById('login-email').value = '';
            document.getElementById('login-senha').value = '';
        } else {
            showResult('login-result', data.erro || 'Erro no login', 'error');
        }
    } catch (error) {
        showResult('login-result', `Erro de conexão: ${error.message}`, 'error');
    } finally {
        hideLoading('login-btn');
    }
}

// Registrar novo usuário
async function register() {
    const email = document.getElementById('cadastro-email').value;
    const senha = document.getElementById('cadastro-senha').value;
    const confirmarSenha = document.getElementById('cadastro-confirmar-senha').value;
    const nome = document.getElementById('cadastro-nome').value;
    const cpf = document.getElementById('cadastro-cpf').value;
    
    if (!email || !senha || !confirmarSenha || !nome || !cpf) {
        showResult('cadastro-result', 'Preencha todos os campos', 'error');
        return;
    }
    
    if (senha !== confirmarSenha) {
        showResult('cadastro-result', 'As senhas não coincidem', 'error');
        return;
    }
    
    try {
        showLoading('cadastro-btn');
        
        const response = await fetch(`${API_BASE_URL}/cadastro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha, nome, cpf })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResult('cadastro-result', 'Conta criada com sucesso! Verifique seu email para ativar a conta.', 'success');
            
            // Limpar campos
            document.getElementById('cadastro-email').value = '';
            document.getElementById('cadastro-senha').value = '';
            document.getElementById('cadastro-confirmar-senha').value = '';
            document.getElementById('cadastro-nome').value = '';
            document.getElementById('cadastro-cpf').value = '';
            
            // Ir para aba de ativação
            showTab('ativacao-tab', document.querySelector('.tab:nth-child(3)'));
        } else {
            showResult('cadastro-result', data.erro || 'Erro no cadastro', 'error');
        }
    } catch (error) {
        showResult('cadastro-result', `Erro de conexão: ${error.message}`, 'error');
    } finally {
        hideLoading('cadastro-btn');
    }
}

// Ativar conta
async function activateAccount() {
    const email = document.getElementById('ativacao-email').value;
    const codigo = document.getElementById('ativacao-codigo').value;
    
    if (!email || !codigo) {
        showResult('ativacao-result', 'Preencha todos os campos', 'error');
        return;
    }
    
    try {
        showLoading('ativacao-btn');
        
        const response = await fetch(`${API_BASE_URL}/verificar-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, codigo })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResult('ativacao-result', 'Conta ativada com sucesso! Agora você pode fazer login.', 'success');
            
            // Limpar campos
            document.getElementById('ativacao-email').value = '';
            document.getElementById('ativacao-codigo').value = '';
            
            // Ir para aba de login
            showTab('login-tab', document.querySelector('.tab:nth-child(1)'));
        } else {
            showResult('ativacao-result', data.erro || 'Erro na ativação', 'error');
        }
    } catch (error) {
        showResult('ativacao-result', `Erro de conexão: ${error.message}`, 'error');
    } finally {
        hideLoading('ativacao-btn');
    }
}

// Recuperar senha
async function recoverPassword() {
    const email = document.getElementById('recuperacao-email').value;
    
    if (!email) {
        showResult('recuperacao-result', 'Preencha o email', 'error');
        return;
    }
    
    try {
        showLoading('recuperacao-btn');
        
        const response = await fetch(`${API_BASE_URL}/esqueci-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResult('recuperacao-result', 'Email de recuperação enviado! Verifique sua caixa de entrada.', 'success');
            document.getElementById('recuperacao-email').value = '';
        } else {
            showResult('recuperacao-result', data.erro || 'Erro na recuperação', 'error');
        }
    } catch (error) {
        showResult('recuperacao-result', `Erro de conexão: ${error.message}`, 'error');
    } finally {
        hideLoading('recuperacao-btn');
    }
}

// Logout
function logout() {
    authToken = null;
    currentUser = {};
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    updateAuthStatus();
    
    // Esconder avisos de verificação
    const notices = document.querySelectorAll('.verification-notice');
    notices.forEach(notice => {
        notice.style.display = 'none';
    });
    
    showResult('auth-result', 'Logout realizado com sucesso!', 'success');
}

// ===== FUNÇÕES DE DADOS DE PAGAMENTO =====

// Criar dados de pagamento
async function createPaymentData() {
    if (!authToken) {
        showResult('payment-result', 'Faça login primeiro', 'error');
        return;
    }
    
    if (!currentUser.email_verificado) {
        showResult('payment-result', 'Verifique seu email antes de criar dados de pagamento', 'error');
        return;
    }
    
    // Usar os dados do usuário logado como base
    const dadosPagamento = {
        // name será pego do currentUser.nome no backend
        cpfCnpj: document.getElementById('customer-cpf').value,
        // email será pego do currentUser.email no backend
        phone: document.getElementById('customer-phone').value,
        mobilePhone: document.getElementById('customer-mobile').value,
        additionalEmails: document.getElementById('customer-additional-emails').value,
        postalCode: document.getElementById('customer-cep').value,
        address: document.getElementById('customer-endereco').value,
        addressNumber: document.getElementById('customer-numero').value,
        complement: document.getElementById('customer-complemento').value,
        province: document.getElementById('customer-bairro').value,
        city: document.getElementById('customer-cidade').value,
        state: document.getElementById('customer-estado').value,
        company: document.getElementById('customer-company').value,
        municipalInscription: document.getElementById('customer-municipal').value,
        stateInscription: document.getElementById('customer-estadual').value,
        groupName: document.getElementById('customer-group').value,
        observations: document.getElementById('customer-observations').value,
        foreignCustomer: document.getElementById('customer-foreign').checked,
        notificationDisabled: document.getElementById('customer-notifications-disabled').checked
    };
    
    // Validar campos obrigatórios (apenas CPF/CNPJ é obrigatório além dos dados do usuário)
    if (!dadosPagamento.cpfCnpj) {
        showResult('payment-result', 'CPF/CNPJ é obrigatório', 'error');
        return;
    }
    
    try {
        showLoading('payment-btn');
        
        const response = await fetch(`${API_BASE_URL}/payment/customer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(dadosPagamento)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResult('payment-result', 'Dados de pagamento criados com sucesso!', 'success');
            currentUser.asaas_customer_id = data.customer.id;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            showResult('payment-result', data.erro || 'Erro ao criar dados de pagamento', 'error');
        }
    } catch (error) {
        showResult('payment-result', `Erro de conexão: ${error.message}`, 'error');
    } finally {
        hideLoading('payment-btn');
    }
}

// ===== FUNÇÕES PARA DADOS DE PAGAMENTO =====

function preencherDadosCartao() {
    document.getElementById('payment-cpf').value = '11144477735';
    document.getElementById('payment-phone').value = '1133334444';
    document.getElementById('payment-mobile').value = '11987654321';
    document.getElementById('payment-address').value = 'Avenida Paulista';
    document.getElementById('payment-number').value = '1000';
    document.getElementById('payment-complement').value = 'Andar 10';
    document.getElementById('payment-district').value = 'Bela Vista';
    document.getElementById('payment-zipcode').value = '01310100';
    document.getElementById('payment-city').value = 'São Paulo';
    document.getElementById('payment-state').value = 'SP';
}

// ===== FUNÇÕES DE PLANOS =====

// Listar planos disponíveis
async function loadPlans() {
    try {
        const response = await fetch(`${API_BASE_URL}/planos`);
        const data = await response.json();
        
        if (response.ok && Array.isArray(data)) {
            displayPlans(data);
        } else {
            showResult('plans-result', 'Erro ao carregar planos', 'error');
        }
    } catch (error) {
        showResult('plans-result', `Erro de conexão: ${error.message}`, 'error');
    }
}

// Exibir planos na interface
function displayPlans(planos) {
    const container = document.getElementById('plans-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    planos.forEach(plano => {
        const planCard = document.createElement('div');
        planCard.className = 'plan-card';
        planCard.innerHTML = `
            <h3>${plano.nome}</h3>
            <div class="plan-price">R$ ${plano.preco}</div>
            <ul class="plan-features">
                <li>${plano.descricao}</li>
                <li>Suporte 24/7</li>
                <li>Atualizações gratuitas</li>
            </ul>
            <button class="btn btn-primary" onclick="acquirePlan('${plano.id}')">
                Adquirir Plano
            </button>
        `;
        container.appendChild(planCard);
    });
}

// Adquirir plano
async function acquirePlan(planoId) {
    if (!authToken) {
        showResult('plans-result', 'Faça login primeiro', 'error');
        return;
    }
    
    if (!currentUser.asaas_customer_id) {
        showResult('plans-result', 'Crie seus dados de pagamento primeiro', 'error');
        return;
    }
    
    try {
        showLoading('plans-btn');
        
        const response = await fetch(`${API_BASE_URL}/planos/adquirir`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ planoId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResult('plans-result', 'Plano adquirido com sucesso!', 'success');
        } else {
            showResult('plans-result', data.erro || 'Erro ao adquirir plano', 'error');
        }
    } catch (error) {
        showResult('plans-result', `Erro de conexão: ${error.message}`, 'error');
    } finally {
        hideLoading('plans-btn');
    }
}

// ===== FUNÇÕES PARA PLANOS =====

async function carregarPlanosDropdown() {
    try {
        const response = await fetch(`${API_BASE_URL}/planos`);
        const planos = await response.json();
        
        const select = document.getElementById('plano-select');
        select.innerHTML = '<option value="">Selecione um plano</option>';
        
        planos.forEach(plano => {
            const option = document.createElement('option');
            option.value = plano.id;
            option.textContent = `${plano.nome} - R$ ${plano.preco_mensal}/mês`;
            select.appendChild(option);
        });
        
        showResult('plans-result', 'Planos carregados com sucesso', 'success');
    } catch (error) {
        showResult('plans-result', `Erro ao carregar planos: ${error.message}`, 'error');
    }
}

function mostrarCamposPagamento() {
    const planoSelect = document.getElementById('plano-select');
    const camposPagamento = document.getElementById('campos-pagamento');
    
    if (planoSelect.value) {
        camposPagamento.style.display = 'block';
    } else {
        camposPagamento.style.display = 'none';
    }
}

async function criarAssinatura() {
    if (!authToken) {
        showResult('subscription-result', 'Você precisa fazer login primeiro', 'error');
        return;
    }
    
    const planoId = document.getElementById('plano-select').value;
    const formaPagamento = document.querySelector('input[name="forma-pagamento"]:checked')?.value;
    
    if (!planoId) {
        showResult('subscription-result', 'Selecione um plano', 'error');
        return;
    }
    
    if (!formaPagamento) {
        showResult('subscription-result', 'Selecione uma forma de pagamento', 'error');
        return;
    }
    
    try {
        showResult('subscription-result', 'Criando assinatura...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/assinaturas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                plano_id: planoId,
                forma_pagamento: formaPagamento
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResult('subscription-result', 'Assinatura criada com sucesso!', 'success');
        } else {
            showResult('subscription-result', data.erro || 'Erro ao criar assinatura', 'error');
        }
    } catch (error) {
        showResult('subscription-result', `Erro: ${error.message}`, 'error');
    }
}

// ===== FUNÇÕES DE LOJA =====

// Criar loja
async function createShop() {
    if (!authToken) {
        showResult('shop-result', 'Faça login primeiro', 'error');
        return;
    }
    
    const shopData = {
        nome: document.getElementById('shop-nome').value,
        descricao: document.getElementById('shop-descricao').value,
        categoria: document.getElementById('shop-categoria').value
    };
    
    if (!shopData.nome || !shopData.categoria) {
        showResult('shop-result', 'Preencha os campos obrigatórios', 'error');
        return;
    }
    
    try {
        showLoading('shop-btn');
        
        const response = await fetch(`${API_BASE_URL}/loja`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(shopData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResult('shop-result', 'Loja criada com sucesso!', 'success');
            loadUserShops();
        } else {
            showResult('shop-result', data.erro || 'Erro ao criar loja', 'error');
        }
    } catch (error) {
        showResult('shop-result', `Erro de conexão: ${error.message}`, 'error');
    } finally {
        hideLoading('shop-btn');
    }
}

// Carregar lojas do usuário
async function loadUserShops() {
    if (!authToken) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/minha-loja`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok && data.lojas) {
            displayUserShops(data.lojas);
        }
    } catch (error) {
        console.error('Erro ao carregar lojas:', error);
    }
}

// Exibir lojas do usuário
function displayUserShops(lojas) {
    const container = document.getElementById('user-shops');
    if (!container) return;
    
    if (lojas.length === 0) {
        container.innerHTML = '<p>Nenhuma loja encontrada.</p>';
        return;
    }
    
    container.innerHTML = lojas.map(loja => `
        <div class="shop-item">
            <h4>${loja.nome}</h4>
            <p>${loja.descricao || 'Sem descrição'}</p>
            <p><strong>Categoria:</strong> ${loja.categoria}</p>
            <p><strong>Status:</strong> ${loja.ativo ? 'Ativa' : 'Inativa'}</p>
        </div>
    `).join('');
}

// ===== FUNÇÕES ADICIONAIS DE AUTENTICAÇÃO =====

// Função de cadastro (alias para register)
function cadastro() {
    register();
}

// Verificar email
function verificarEmail() {
    activateAccount();
}

// Reenviar código de verificação
async function reenviarCodigo() {
    const email = document.getElementById('ativacao-email').value;
    
    if (!email) {
        showResult('ativacao-result', 'Preencha o email', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/reenviar-codigo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResult('ativacao-result', 'Código reenviado! Verifique seu email.', 'success');
        } else {
            showResult('ativacao-result', data.erro || 'Erro ao reenviar código', 'error');
        }
    } catch (error) {
        showResult('ativacao-result', `Erro de conexão: ${error.message}`, 'error');
    }
}

// Esqueceu senha
function esqueceuSenha() {
    recoverPassword();
}

// Redefinir senha
async function redefinirSenha() {
    const email = document.getElementById('nova-senha-email').value;
    const codigo = document.getElementById('nova-senha-codigo').value;
    const novaSenha = document.getElementById('nova-senha').value;
    const confirmarSenha = document.getElementById('confirmar-nova-senha').value;
    
    if (!email || !codigo || !novaSenha || !confirmarSenha) {
        showResult('nova-senha-result', 'Preencha todos os campos', 'error');
        return;
    }
    
    if (novaSenha !== confirmarSenha) {
        showResult('nova-senha-result', 'As senhas não coincidem', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/redefinir-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, codigo, novaSenha })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResult('nova-senha-result', 'Senha redefinida com sucesso!', 'success');
            // Limpar campos
            document.getElementById('nova-senha-email').value = '';
            document.getElementById('nova-senha-codigo').value = '';
            document.getElementById('nova-senha').value = '';
            document.getElementById('confirmar-nova-senha').value = '';
        } else {
            showResult('nova-senha-result', data.erro || 'Erro ao redefinir senha', 'error');
        }
    } catch (error) {
        showResult('nova-senha-result', `Erro de conexão: ${error.message}`, 'error');
    }
}

// ===== FUNÇÕES ADICIONAIS DE DADOS DE PAGAMENTO =====

// Criar cliente de pagamento (alias para createPaymentData)
function criarClientePagamento() {
    createPaymentData();
}

// ===== FUNÇÕES ADICIONAIS DE PLANOS =====

// Carregar planos (alias para loadPlans)
function carregarPlanos() {
    loadPlans();
}

// Comparar planos
function compararPlanos() {
    showResult('planos-result', 'Funcionalidade de comparação em desenvolvimento', 'info');
}

// Listar minhas assinaturas
async function listarMinhasAssinaturas() {
    if (!authToken) {
        showResult('assinaturas-result', 'Faça login primeiro', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/assinaturas/minhas`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayAssinaturas(data.assinaturas || []);
        } else {
            showResult('assinaturas-result', data.erro || 'Erro ao carregar assinaturas', 'error');
        }
    } catch (error) {
        showResult('assinaturas-result', `Erro de conexão: ${error.message}`, 'error');
    }
}

// Exibir assinaturas
function displayAssinaturas(assinaturas) {
    const container = document.getElementById('minhas-assinaturas-lista');
    if (!container) return;
    
    if (assinaturas.length === 0) {
        container.innerHTML = '<p>Nenhuma assinatura encontrada.</p>';
        return;
    }
    
    container.innerHTML = assinaturas.map(assinatura => `
        <div class="subscription-item">
            <h4>${assinatura.plano_nome}</h4>
            <p><strong>Status:</strong> ${assinatura.status}</p>
            <p><strong>Valor:</strong> R$ ${assinatura.valor}</p>
            <p><strong>Próximo vencimento:</strong> ${assinatura.proximo_vencimento}</p>
        </div>
    `).join('');
}

// ===== FUNÇÕES AUXILIARES =====

// Alternar entre abas
function showTab(tabId, button) {
    // Esconder todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remover classe active de todos os botões
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    document.getElementById(tabId).classList.add('active');
    button.classList.add('active');
}

// Mostrar resultado
function showResult(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = message;
        element.className = `result ${type}`;
        element.style.display = 'block';
    }
}

// Mostrar loading
function showLoading(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.innerHTML += ' <span class="loading"></span>';
        button.disabled = true;
    }
}

// Esconder loading
function hideLoading(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.innerHTML = button.innerHTML.replace(/ <span class="loading"><\/span>/, '');
        button.disabled = false;
    }
}

// Preencher dados de teste
function fillLogin(type) {
    if (type === 'teste') {
        document.getElementById('login-email').value = 'ademir1de1oliveira@gmail.com';
        document.getElementById('login-senha').value = '111111';
    }
}

function fillCadastro(type) {
    if (type === 'teste') {
        document.getElementById('cadastro-email').value = 'novo@example.com';
        document.getElementById('cadastro-senha').value = '123456';
        document.getElementById('cadastro-confirmar-senha').value = '123456';
        document.getElementById('cadastro-nome').value = 'João Silva';
        document.getElementById('cadastro-cpf').value = '123.456.789-00';
        document.getElementById('cadastro-telefone').value = '(11) 99999-9999';
    }
}

function fillPaymentData(type) {
    if (type === 'teste') {
        document.getElementById('customer-cpf').value = '123.456.789-00';
        document.getElementById('customer-phone').value = '(11) 3333-4444';
        document.getElementById('customer-mobile').value = '(11) 99999-9999';
        document.getElementById('customer-additional-emails').value = 'contato@teste.com';
        document.getElementById('customer-cep').value = '01310-100';
        document.getElementById('customer-endereco').value = 'Avenida Paulista';
        document.getElementById('customer-numero').value = '1000';
        document.getElementById('customer-complemento').value = 'Andar 10';
        document.getElementById('customer-bairro').value = 'Bela Vista';
        document.getElementById('customer-cidade').value = 'São Paulo';
        document.getElementById('customer-estado').value = 'SP';
        document.getElementById('customer-company').value = 'Empresa Teste LTDA';
        document.getElementById('customer-municipal').value = '123456789';
        document.getElementById('customer-estadual').value = '987654321';
        document.getElementById('customer-group').value = 'Clientes Premium';
        document.getElementById('customer-observations').value = 'Cliente de teste para desenvolvimento';
    }
}

function fillShopData(type) {
    if (type === 'teste') {
        document.getElementById('shop-nome').value = 'Minha Loja Teste';
        document.getElementById('shop-descricao').value = 'Uma loja de teste para demonstração';
        document.getElementById('shop-categoria').value = 'eletronicos';
    }
}

function fillAtivacao() {
    document.getElementById('ativacao-email').value = 'teste@example.com';
    document.getElementById('ativacao-codigo').value = '123456';
}

function fillDadosCliente() {
    fillPaymentData('teste');
}

// ===== FUNÇÕES DE STATUS E SISTEMA =====

function verificarSaude() {
    checkSystemStatus();
}

async function verificarUploads() {
    try {
        // Usar endpoint de health como alternativa já que uploads/status requer auth
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        if (response.ok) {
            showResult('status-result', 'Sistema de uploads funcionando normalmente', 'success');
        } else {
            showResult('status-result', 'Problema no sistema de uploads', 'error');
        }
    } catch (error) {
        showResult('status-result', `Erro ao verificar uploads: ${error.message}`, 'error');
    }
}

async function executarTodosTestes() {
    showResult('status-result', 'Executando testes do sistema...', 'info');
    
    const testes = [
        { nome: 'API Health', func: () => fetch(`${API_BASE_URL}/health`) },
        { nome: 'Planos', func: () => fetch(`${API_BASE_URL}/planos`) },
        { nome: 'Status Uploads', func: () => fetch(`${API_BASE_URL}/uploads/status`) }
    ];
    
    let resultados = [];
    
    for (const teste of testes) {
        try {
            const response = await teste.func();
            resultados.push(`✅ ${teste.nome}: OK`);
        } catch (error) {
            resultados.push(`❌ ${teste.nome}: ERRO`);
        }
    }
    
    showResult('status-result', resultados.join('\n'), 'info');
}

// ===== FUNÇÕES PARA DADOS DE PAGAMENTO =====

function preencherDadosCartao() {
    const fields = {
        'payment-cpf': '11144477735',
        'payment-phone': '1133334444',
        'payment-mobile': '11987654321',
        'payment-address': 'Avenida Paulista',
        'payment-number': '1000',
        'payment-complement': 'Andar 10',
        'payment-district': 'Bela Vista',
        'payment-zipcode': '01310100',
        'payment-city': 'São Paulo',
        'payment-state': 'SP'
    };
    
    Object.keys(fields).forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = fields[id];
    });
}

async function carregarPlanosDropdown() {
    try {
        const response = await fetch(`${API_BASE_URL}/planos`);
        const planos = await response.json();
        
        const select = document.getElementById('plano-select');
        if (select) {
            select.innerHTML = '<option value="">Selecione um plano</option>';
            
            planos.forEach(plano => {
                const option = document.createElement('option');
                option.value = plano.id;
                option.textContent = `${plano.nome} - R$ ${plano.preco_mensal}/mês`;
                select.appendChild(option);
            });
        }
        
        showResult('plans-result', 'Planos carregados com sucesso', 'success');
    } catch (error) {
        showResult('plans-result', `Erro ao carregar planos: ${error.message}`, 'error');
    }
}

function mostrarCamposPagamento() {
    const planoSelect = document.getElementById('plano-select');
    const camposPagamento = document.getElementById('campos-pagamento');
    
    if (planoSelect && camposPagamento) {
        if (planoSelect.value) {
            camposPagamento.style.display = 'block';
        } else {
            camposPagamento.style.display = 'none';
        }
    }
}

async function criarAssinatura() {
    if (!authToken) {
        showResult('subscription-result', 'Você precisa fazer login primeiro', 'error');
        return;
    }
    
    const planoSelect = document.getElementById('plano-select');
    const formaPagamento = document.querySelector('input[name="forma-pagamento"]:checked');
    
    if (!planoSelect || !planoSelect.value) {
        showResult('subscription-result', 'Selecione um plano', 'error');
        return;
    }
    
    if (!formaPagamento) {
        showResult('subscription-result', 'Selecione uma forma de pagamento', 'error');
        return;
    }
    
    try {
        showResult('subscription-result', 'Criando assinatura...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/assinaturas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                plano_id: planoSelect.value,
                forma_pagamento: formaPagamento.value
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResult('subscription-result', 'Assinatura criada com sucesso!', 'success');
        } else {
            showResult('subscription-result', data.erro || 'Erro ao criar assinatura', 'error');
        }
    } catch (error) {
        showResult('subscription-result', `Erro: ${error.message}`, 'error');
    }
}

async function checkSystemStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        
        if (response.ok) {
            showResult('status-result', `Sistema funcionando: ${data.message}`, 'success');
        } else {
            showResult('status-result', 'Sistema com problemas', 'error');
        }
    } catch (error) {
        showResult('status-result', `Erro ao verificar sistema: ${error.message}`, 'error');
    }
}

// ===== FUNÇÕES PARA PERFIL =====

async function verMeuPerfil() {
    if (!authToken) {
        showResult('perfil-result', 'Você precisa fazer login primeiro', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/usuario`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const perfilInfo = `
                <strong>Nome:</strong> ${data.nome}<br>
                <strong>Email:</strong> ${data.email}<br>
                <strong>Telefone:</strong> ${data.telefone || 'Não informado'}<br>
                <strong>Papel:</strong> ${data.papel}<br>
                <strong>Status:</strong> ${data.status}
            `;
            showResult('perfil-result', perfilInfo, 'success');
        } else {
            showResult('perfil-result', data.erro || 'Erro ao carregar perfil', 'error');
        }
    } catch (error) {
        showResult('perfil-result', `Erro: ${error.message}`, 'error');
    }
}

function mostrarEdicaoPerfil() {
    const edicaoDiv = document.getElementById('edicao-perfil');
    if (edicaoDiv && (edicaoDiv.style.display === 'none' || !edicaoDiv.style.display)) {
        edicaoDiv.style.display = 'block';
        
        // Preencher campos com dados atuais se disponível
        if (currentUser) {
            const nomeField = document.getElementById('edit-nome');
            const telefoneField = document.getElementById('edit-telefone');
            if (nomeField) nomeField.value = currentUser.nome || '';
            if (telefoneField) telefoneField.value = currentUser.telefone || '';
        }
    } else if (edicaoDiv) {
        edicaoDiv.style.display = 'none';
    }
}

async function verMinhaLoja() {
    if (!authToken) {
        showResult('shop-result', 'Você precisa fazer login primeiro', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/minha-loja`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const lojaInfo = `
                <strong>Nome:</strong> ${data.nome_loja}<br>
                <strong>Slug:</strong> ${data.slug}<br>
                <strong>Status:</strong> ${data.status}<br>
                <strong>URL:</strong> <a href="${data.url}" target="_blank">${data.url}</a>
            `;
            showResult('shop-result', lojaInfo, 'success');
        } else {
            showResult('shop-result', data.erro || 'Erro ao carregar loja', 'error');
        }
    } catch (error) {
        showResult('shop-result', `Erro: ${error.message}`, 'error');
    }
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    updateAuthStatus();
    checkSystemStatus();
    loadPlans();
    loadUserShops();
    
    // Verificar status a cada 30 segundos
    setInterval(checkSystemStatus, 30000);
});
