/**
 * Migration para adicionar campos de integração Asaas na tabela assinaturas
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('assinaturas', 'asaas_subscription_id', {
    type: Sequelize.STRING,
    allowNull: true,
    unique: true,
    comment: 'ID da assinatura no Asaas'
  });

  await queryInterface.addColumn('assinaturas', 'ultimo_pagamento', {
    type: Sequelize.DATE,
    allowNull: true,
    comment: 'Data do último pagamento confirmado'
  });

  await queryInterface.addColumn('assinaturas', 'forma_pagamento', {
    type: Sequelize.ENUM('CREDIT_CARD', 'BOLETO', 'PIX'),
    allowNull: true,
    comment: 'Forma de pagamento utilizada'
  });

  await queryInterface.addColumn('assinaturas', 'metadata', {
    type: Sequelize.JSONB,
    allowNull: true,
    comment: 'Dados adicionais da integração'
  });

  // Adicionar índices para performance
  await queryInterface.addIndex('assinaturas', ['asaas_subscription_id'], {
    name: 'idx_assinaturas_asaas_subscription_id'
  });

  await queryInterface.addIndex('assinaturas', ['status'], {
    name: 'idx_assinaturas_status'
  });
  },

  down: async (queryInterface, Sequelize) => {
  await queryInterface.removeIndex('assinaturas', 'idx_assinaturas_status');
  await queryInterface.removeIndex('assinaturas', 'idx_assinaturas_asaas_subscription_id');
  
  await queryInterface.removeColumn('assinaturas', 'metadata');
  await queryInterface.removeColumn('assinaturas', 'forma_pagamento');
  await queryInterface.removeColumn('assinaturas', 'ultimo_pagamento');
  await queryInterface.removeColumn('assinaturas', 'asaas_subscription_id');
  
  // Remover ENUM se não estiver sendo usado em outros lugares
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_assinaturas_forma_pagamento";');
  }
};
