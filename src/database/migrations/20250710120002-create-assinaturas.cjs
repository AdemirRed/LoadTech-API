module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('assinaturas', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      plano_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'planos',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      tipo_periodo: {
        type: Sequelize.ENUM('mensal', 'anual'),
        allowNull: false,
        defaultValue: 'mensal',
      },
      status: {
        type: Sequelize.ENUM('ativa', 'cancelada', 'suspensa', 'expirada', 'periodo_gratuito'),
        allowNull: false,
        defaultValue: 'periodo_gratuito',
      },
      data_inicio: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      data_fim: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      data_proxima_cobranca: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      valor_pago: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      desconto_aplicado: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      metodo_pagamento: {
        type: Sequelize.ENUM('cartao_credito', 'cartao_debito', 'pix', 'boleto', 'gratuito'),
        allowNull: false,
        defaultValue: 'gratuito',
      },
      gateway_assinatura_id: {
        type: Sequelize.STRING, // ID da assinatura no gateway de pagamento
        allowNull: true,
      },
      auto_renovacao: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      data_cancelamento: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      motivo_cancelamento: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    // Índices para melhor performance
    await queryInterface.addIndex('assinaturas', ['user_id']);
    await queryInterface.addIndex('assinaturas', ['plano_id']);
    await queryInterface.addIndex('assinaturas', ['status']);
    await queryInterface.addIndex('assinaturas', ['data_proxima_cobranca']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('assinaturas');
  },
};
