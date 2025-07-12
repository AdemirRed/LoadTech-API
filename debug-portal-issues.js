// Debug específico para os problemas reportados

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJmNmJhYmE5LWE5MjQtNGRlMS05ZWM0LTc2NjI3NDg4MDZlMyIsInVzdWFyaW9faWQiOiIyZjZiYWJhOS1hOTI0LTRkZTEtOWVjNC03NjYyNzQ4ODA2ZTMiLCJwYXBlbCI6InVzdWFyaW8iLCJub21lIjoiQWRlbWlyIiwiaWF0IjoxNzUyMjg1OTcyLCJleHAiOjE3NTI4OTA3NzJ9.-xiCHsMFT-2ra1KMgL5vO-re4zO2bxQmjxIcUoe0Ww8';

async function testarPlanos() {
    console.log('\n📋 TESTANDO LISTAGEM DE PLANOS...');
    try {
        const response = await fetch(`${API_BASE_URL}/planos`);
        const data = await response.json();
        
        console.log('📊 Status:', response.status);
        console.log('📋 Quantidade de planos:', data?.length || 0);
        
        if (response.ok && data.length > 0) {
            console.log('✅ Planos encontrados:');
            data.forEach((plano, index) => {
                console.log(`  ${index + 1}. ${plano.nome} - R$ ${plano.preco_mensal}`);
            });
        } else {
            console.log('❌ Problema ao carregar planos:', data);
        }
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

async function testarMinhaLoja() {
    console.log('\n🏪 TESTANDO MINHA LOJA...');
    try {
        const response = await fetch(`${API_BASE_URL}/minha-loja`, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });
        const data = await response.json();
        
        console.log('📊 Status:', response.status);
        
        if (response.ok) {
            console.log('✅ Loja encontrada:');
            console.log(`  Nome: ${data.nome_loja}`);
            console.log(`  Slug: ${data.slug}`);
            console.log(`  Status: ${data.status}`);
            console.log(`  URL: ${data.url}`);
        } else {
            console.log('❌ Problema:', data);
        }
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

async function testarMeuPerfil() {
    console.log('\n👤 TESTANDO MEU PERFIL...');
    try {
        const response = await fetch(`${API_BASE_URL}/usuario`, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });
        const data = await response.json();
        
        console.log('📊 Status:', response.status);
        
        if (response.ok) {
            console.log('✅ Perfil encontrado:');
            console.log(`  Nome: ${data.nome}`);
            console.log(`  Email: ${data.email}`);
            console.log(`  Telefone: ${data.telefone || 'Não informado'}`);
            console.log(`  Status: ${data.status}`);
        } else {
            console.log('❌ Problema:', data);
        }
    } catch (error) {
        console.log('❌ Erro:', error.message);
    }
}

async function executarTestes() {
    console.log('🔍 DEBUGANDO PROBLEMAS DO PORTAL...');
    
    await testarPlanos();
    await testarMinhaLoja();
    await testarMeuPerfil();
    
    console.log('\n✅ Testes concluídos!');
}

executarTestes();
