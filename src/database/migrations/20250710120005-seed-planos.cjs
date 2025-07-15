module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { v4: uuidv4 } = require('uuid');

    await queryInterface.bulkInsert('planos', [
      {
        id: uuidv4(),
        nome: 'Básico',
        descricao: 'Ideal para quem está começando no e-commerce',
        preco_mensal: 29.90,
        preco_anual: 299.90,
        desconto_anual: 17, // ~2 meses grátis
        limite_produtos: 100,
        limite_vendas_mes: 500,
        taxa_transacao: 2.99,
        funcionalidades: JSON.stringify([
          'Loja virtual responsiva',
          'Até 100 produtos',
          'Até 500 vendas/mês',
          'Certificado SSL gratuito',
          'Suporte por chat',
          'Relatórios básicos',
          'Integração com redes sociais',
          'Gateway de pagamento',
        ]),
        status: 'ativo',
        periodo_gratuito: 7, // 7 dias grátis
        destaque: false,
        ordem_exibicao: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        nome: 'Profissional',
        descricao: 'Para empresas que querem expandir suas vendas',
        preco_mensal: 59.90,
        preco_anual: 599.90,
        desconto_anual: 17, // ~2 meses grátis
        limite_produtos: 1000,
        limite_vendas_mes: 5000,
        taxa_transacao: 2.49,
        funcionalidades: JSON.stringify([
          'Tudo do plano Básico',
          'Até 1.000 produtos',
          'Até 5.000 vendas/mês',
          'Domínio personalizado',
          'E-mail marketing',
          'Relatórios avançados',
          'Integração com marketplaces',
          'Suporte prioritário',
          'Abandono de carrinho',
          'Cupons de desconto',
        ]),
        status: 'ativo',
        periodo_gratuito: 14, // 14 dias grátis
        destaque: true,
        ordem_exibicao: 2,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        nome: 'Enterprise',
        descricao: 'Solução completa para grandes empresas',
        preco_mensal: 149.90,
        preco_anual: 1499.90,
        desconto_anual: 17, // ~2 meses grátis
        limite_produtos: null, // Ilimitado
        limite_vendas_mes: null, // Ilimitado
        taxa_transacao: 1.99,
        funcionalidades: JSON.stringify([
          'Tudo do plano Profissional',
          'Produtos ilimitados',
          'Vendas ilimitadas',
          'API completa',
          'Múltiplas lojas',
          'Gerente de conta dedicado',
          'Suporte 24/7',
          'Relatórios personalizados',
          'Integração personalizada',
          'Backup automático',
          'CDN global',
          'Multi-idioma',
        ]),
        status: 'ativo',
        periodo_gratuito: 30, // 30 dias grátis
        destaque: false,
        ordem_exibicao: 3,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        nome: 'Gratuito',
        descricao: 'Para testar a plataforma LoadTech',
        preco_mensal: 0.00,
        preco_anual: 0.00,
        desconto_anual: 0,
        limite_produtos: 10,
        limite_vendas_mes: 50,
        taxa_transacao: 4.99,
        funcionalidades: JSON.stringify([
          'Loja virtual básica',
          'Até 10 produtos',
          'Até 50 vendas/mês',
          'Subdomínio LoadTech',
          'Suporte por e-mail',
          'Marca LoadTech na loja',
        ]),
        status: 'ativo',
        periodo_gratuito: 0, // Sempre gratuito
        destaque: false,
        ordem_exibicao: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('planos', null, {});
  },
};
