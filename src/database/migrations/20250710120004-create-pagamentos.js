module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('pagamentos', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      assinatura_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'assinaturas',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      valor: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pendente', 'aprovado', 'recusado', 'cancelado', 'estornado'),
        allowNull: false,
        defaultValue: 'pendente',
      },
      metodo_pagamento: {
        type: Sequelize.ENUM('cartao_credito', 'cartao_debito', 'pix', 'boleto'),
        allowNull: false,
      },
      gateway: {
        type: Sequelize.ENUM('mercadopago', 'pagseguro', 'stripe', 'paypal'),
        allowNull: false,
      },
      gateway_transacao_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gateway_response: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      data_vencimento: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      data_pagamento: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      taxa_gateway: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      valor_liquido: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Índices
    await queryInterface.addIndex('pagamentos', ['assinatura_id']);
    await queryInterface.addIndex('pagamentos', ['status']);
    await queryInterface.addIndex('pagamentos', ['gateway_transacao_id']);
    await queryInterface.addIndex('pagamentos', ['data_vencimento']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('pagamentos');
  },
};
