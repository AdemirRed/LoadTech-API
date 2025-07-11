/**
 * 🚀 EXEMPLOS DE USO DO REDIS NA LOADTECH API
 * 
 * Este arquivo mostra como usar o Redis para:
 * - Cache de dados
 * - Rate limiting
 * - Sessões
 * - Estatísticas
 */

import { cache } from './src/config/redis.js';

// ===== EXEMPLOS PRÁTICOS =====

// 1. 💾 Cache de consulta pesada
async function exemploCache() {
  console.log('\n🔍 === EXEMPLO: CACHE DE DADOS ===');
  
  // Simular consulta pesada
  const buscarProdutosPesados = async () => {
    console.log('🔄 Fazendo consulta pesada no banco...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simula 2s
    return [
      { id: 1, nome: 'Produto 1', preco: 99.90 },
      { id: 2, nome: 'Produto 2', preco: 149.90 }
    ];
  };

  const cacheKey = 'produtos:populares';
  
  // Tenta obter do cache
  let produtos = await cache.get(cacheKey);
  
  if (produtos) {
    console.log('🚀 Cache HIT! Dados obtidos do Redis:', produtos);
  } else {
    console.log('📦 Cache MISS! Buscando do banco...');
    produtos = await buscarProdutosPesados();
    
    // Salva no cache por 10 minutos
    await cache.set(cacheKey, produtos, 600);
    console.log('💾 Dados salvos no cache');
  }
  
  return produtos;
}

// 2. 🛡️ Rate Limiting
async function exemploRateLimit() {
  console.log('\n🛡️ === EXEMPLO: RATE LIMITING ===');
  
  const clienteIP = '192.168.1.100';
  const maxTentativas = 5;
  const janelaTempo = 300; // 5 minutos
  
  const key = `rate_limit:${clienteIP}`;
  const tentativas = await cache.incr(key, janelaTempo);
  
  console.log(`📊 Cliente ${clienteIP}: ${tentativas}/${maxTentativas} tentativas`);
  
  if (tentativas > maxTentativas) {
    console.log('🚫 BLOQUEADO! Muitas tentativas');
    return false;
  } else {
    console.log('✅ PERMITIDO! Dentro do limite');
    return true;
  }
}

// 3. 👤 Sessão de usuário
async function exemploSessao() {
  console.log('\n👤 === EXEMPLO: SESSÃO DE USUÁRIO ===');
  
  const userId = 123;
  const sessaoKey = `sessao:user:${userId}`;
  
  // Dados da sessão
  const dadosSessao = {
    userId: 123,
    email: 'usuario@loadtech.com',
    role: 'admin',
    loginAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };
  
  // Salvar sessão por 24 horas
  await cache.set(sessaoKey, dadosSessao, 86400);
  console.log('💾 Sessão salva:', dadosSessao);
  
  // Recuperar sessão
  const sessaoRecuperada = await cache.get(sessaoKey);
  console.log('📖 Sessão recuperada:', sessaoRecuperada);
  
  // Atualizar última atividade
  if (sessaoRecuperada) {
    sessaoRecuperada.lastActivity = new Date().toISOString();
    await cache.set(sessaoKey, sessaoRecuperada, 86400);
    console.log('🔄 Última atividade atualizada');
  }
}

// 4. 📊 Estatísticas em tempo real
async function exemploEstatisticas() {
  console.log('\n📊 === EXEMPLO: ESTATÍSTICAS ===');
  
  const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Contadores
  const keys = {
    uploads: `stats:uploads:${hoje}`,
    logins: `stats:logins:${hoje}`,
    vendas: `stats:vendas:${hoje}`
  };
  
  // Simular eventos
  await cache.incr(keys.uploads, 86400); // Upload
  await cache.incr(keys.uploads, 86400); // Mais um upload
  await cache.incr(keys.logins, 86400);  // Login
  await cache.incr(keys.vendas, 86400);  // Venda
  
  // Obter estatísticas
  const stats = {};
  for (const [nome, key] of Object.entries(keys)) {
    const valor = await cache.get(key) || 0;
    stats[nome] = parseInt(valor);
  }
  
  console.log('📈 Estatísticas de hoje:', stats);
}

// 5. 🗑️ Limpeza de cache
async function exemploLimpeza() {
  console.log('\n🗑️ === EXEMPLO: LIMPEZA DE CACHE ===');
  
  // Listar todas as chaves
  const todasChaves = await cache.keys('*');
  console.log('🔑 Total de chaves no Redis:', todasChaves.length);
  
  // Listar apenas chaves de cache
  const chavesDCache = await cache.keys('cache:*');
  console.log('📦 Chaves de cache:', chavesDCache);
  
  // Listar chaves de rate limit
  const chavesRateLimit = await cache.keys('rate_limit:*');
  console.log('🛡️ Chaves de rate limit:', chavesRateLimit);
  
  // Exemplo: limpar cache antigo
  // await cache.del('produtos:populares');
  // console.log('🗑️ Cache de produtos limpo');
}

// ===== EXECUTAR EXEMPLOS =====
async function executarExemplos() {
  try {
    console.log('🚀 === INICIANDO EXEMPLOS DE REDIS ===\\n');
    
    await exemploCache();
    await exemploRateLimit();
    await exemploSessao();
    await exemploEstatisticas();
    await exemploLimpeza();
    
    console.log('\\n✅ === TODOS OS EXEMPLOS EXECUTADOS ===');
  } catch (error) {
    console.error('❌ Erro nos exemplos:', error.message);
  }
}

// Executar se chamado diretamente
if (process.argv[1].endsWith('redis-examples.js')) {
  executarExemplos();
}

export { 
  exemploCache, 
  exemploRateLimit, 
  exemploSessao, 
  exemploEstatisticas, 
  exemploLimpeza 
};
