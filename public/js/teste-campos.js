// Teste rápido das funções do portal cliente
console.log('🧪 Testando campos do formulário de cadastro...');

// Verificar se todos os campos necessários existem
const camposObrigatorios = [
    'cadastro-email',
    'cadastro-senha', 
    'cadastro-confirmar-senha',
    'cadastro-nome',
    'cadastro-cpf'
];

const camposOpcionais = [
    'cadastro-telefone'
];

console.log('\n📋 Verificando campos obrigatórios:');
camposObrigatorios.forEach(campo => {
    const elemento = document.getElementById(campo);
    if (elemento) {
        console.log(`✅ ${campo}: encontrado`);
    } else {
        console.log(`❌ ${campo}: NÃO encontrado`);
    }
});

console.log('\n📋 Verificando campos opcionais:');
camposOpcionais.forEach(campo => {
    const elemento = document.getElementById(campo);
    if (elemento) {
        console.log(`✅ ${campo}: encontrado`);
    } else {
        console.log(`❌ ${campo}: NÃO encontrado`);
    }
});

// Verificar botões
const botoes = [
    'login-btn',
    'cadastro-btn',
    'ativacao-btn',
    'recuperacao-btn',
    'payment-btn',
    'shop-btn'
];

console.log('\n🔘 Verificando botões:');
botoes.forEach(botao => {
    const elemento = document.getElementById(botao);
    if (elemento) {
        console.log(`✅ ${botao}: encontrado`);
    } else {
        console.log(`❌ ${botao}: NÃO encontrado`);
    }
});

// Verificar containers de resultado
const resultados = [
    'login-result',
    'cadastro-result',
    'ativacao-result',
    'recuperacao-result',
    'payment-result',
    'plans-result',
    'assinaturas-result',
    'shop-result',
    'status-result'
];

console.log('\n📊 Verificando containers de resultado:');
resultados.forEach(resultado => {
    const elemento = document.getElementById(resultado);
    if (elemento) {
        console.log(`✅ ${resultado}: encontrado`);
    } else {
        console.log(`❌ ${resultado}: NÃO encontrado`);
    }
});

console.log('\n🎯 Teste de preenchimento automático:');
try {
    fillCadastro('teste');
    console.log('✅ fillCadastro executado com sucesso');
} catch (error) {
    console.log('❌ Erro no fillCadastro:', error.message);
}

console.log('\n🎯 Teste de API Base URL:');
console.log('API Base URL:', API_BASE_URL || 'NÃO DEFINIDA');

console.log('\n🎯 Teste de autenticação:');
console.log('Auth Token:', authToken || 'NÃO DEFINIDO');
console.log('Current User:', currentUser || 'NÃO DEFINIDO');

console.log('\n✅ Teste concluído! Verifique os resultados acima.');

// Função para testar cadastro de forma segura
function testarCadastro() {
    console.log('\n🧪 Iniciando teste de cadastro...');
    
    try {
        // Preencher dados de teste
        fillCadastro('teste');
        console.log('✅ Dados preenchidos');
        
        // Simular clique no botão (sem executar a requisição)
        console.log('🔘 Simulando clique no botão de cadastro...');
        
        // Verificar se todos os campos estão preenchidos
        const email = document.getElementById('cadastro-email').value;
        const senha = document.getElementById('cadastro-senha').value;
        const confirmarSenha = document.getElementById('cadastro-confirmar-senha').value;
        const nome = document.getElementById('cadastro-nome').value;
        const cpf = document.getElementById('cadastro-cpf').value;
        
        console.log('📝 Valores dos campos:');
        console.log('Email:', email);
        console.log('Senha:', senha ? '***' : 'VAZIO');
        console.log('Confirmar Senha:', confirmarSenha ? '***' : 'VAZIO');
        console.log('Nome:', nome);
        console.log('CPF:', cpf);
        
        if (!email || !senha || !confirmarSenha || !nome || !cpf) {
            console.log('❌ Campos obrigatórios não preenchidos');
            return;
        }
        
        if (senha !== confirmarSenha) {
            console.log('❌ Senhas não coincidem');
            return;
        }
        
        console.log('✅ Validação dos campos passou!');
        console.log('🎯 Pronto para fazer cadastro real');
        
    } catch (error) {
        console.log('❌ Erro no teste:', error.message);
    }
}

// Expor função para teste manual
window.testarCadastro = testarCadastro;
