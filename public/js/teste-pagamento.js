// Teste específico para dados de pagamento
console.log('🧪 Testando criação de dados de pagamento...');

// Simular usuário logado com email verificado
const mockUser = {
    id: 'test-user-123',
    nome: 'João Silva Teste',
    email: 'ademir1de1oliveira@gmail.com',
    email_verificado: true,
    status: 'ativo'
};

const mockToken = 'mock-token-123';

// Simular dados no localStorage
localStorage.setItem('currentUser', JSON.stringify(mockUser));
localStorage.setItem('authToken', mockToken);

// Função para testar preenchimento de dados
function testarPreenchimentoDados() {
    console.log('\n📋 Testando preenchimento automático...');
    
    try {
        fillDadosCliente();
        console.log('✅ Preenchimento automático funcionou');
        
        // Verificar se os campos foram preenchidos
        const campos = [
            'customer-cpf',
            'customer-phone', 
            'customer-mobile',
            'customer-cep',
            'customer-endereco',
            'customer-numero',
            'customer-bairro',
            'customer-cidade',
            'customer-estado'
        ];
        
        console.log('\n📝 Verificando campos preenchidos:');
        campos.forEach(campo => {
            const elemento = document.getElementById(campo);
            if (elemento && elemento.value) {
                console.log(`✅ ${campo}: ${elemento.value}`);
            } else {
                console.log(`❌ ${campo}: vazio ou não encontrado`);
            }
        });
        
    } catch (error) {
        console.log('❌ Erro no preenchimento:', error);
    }
}

// Função para simular criação de dados de pagamento (sem fazer requisição real)
function testarCriacaoDadosPagamento() {
    console.log('\n💳 Testando criação de dados de pagamento...');
    
    // Simular que o usuário está logado
    window.currentUser = mockUser;
    window.authToken = mockToken;
    
    try {
        // Preencher dados primeiro
        fillDadosCliente();
        
        // Coletar dados que seriam enviados
        const dadosPagamento = {
            cpfCnpj: document.getElementById('customer-cpf').value,
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
        
        // Remover campos vazios
        Object.keys(dadosPagamento).forEach(key => {
            if (!dadosPagamento[key]) {
                delete dadosPagamento[key];
            }
        });
        
        console.log('📤 Dados que seriam enviados para o backend:');
        console.log(JSON.stringify(dadosPagamento, null, 2));
        
        // Verificar campos obrigatórios
        if (!dadosPagamento.cpfCnpj) {
            console.log('❌ CPF/CNPJ é obrigatório');
            return false;
        }
        
        console.log('✅ Dados válidos para envio');
        console.log('🏦 O backend usará os dados do usuário logado:');
        console.log(`- Nome: ${mockUser.nome}`);
        console.log(`- Email: ${mockUser.email}`);
        console.log(`- Status: ${mockUser.status}`);
        
        return true;
        
    } catch (error) {
        console.log('❌ Erro na coleta de dados:', error);
        return false;
    }
}

// Executar testes
testarPreenchimentoDados();
setTimeout(() => {
    testarCriacaoDadosPagamento();
}, 1000);

// Expor funções para teste manual
window.testarPreenchimentoDados = testarPreenchimentoDados;
window.testarCriacaoDadosPagamento = testarCriacaoDadosPagamento;
