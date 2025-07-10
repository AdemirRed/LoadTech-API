module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('planos', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      nome: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      preco_mensal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      preco_anual: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      desconto_anual: {
        type: Sequelize.INTEGER, // Porcentagem de desconto
        allowNull: false,
        defaultValue: 0,
      },
      limite_produtos: {
        type: Sequelize.INTEGER,
        allowNull: true, // null = ilimitado
      },
      limite_vendas_mes: {
        type: Sequelize.INTEGER,
        allowNull: true, // null = ilimitado
      },
      taxa_transacao: {
        type: Sequelize.DECIMAL(5, 2), // Porcentagem da taxa
        allowNull: false,
        defaultValue: 0,
      },
      funcionalidades: {
        type: Sequelize.JSON, // Array de funcionalidades
        allowNull: false,
        defaultValue: [],
      },
      status: {
        type: Sequelize.ENUM('ativo', 'inativo'),
        allowNull: false,
        defaultValue: 'ativo',
      },
      periodo_gratuito: {
        type: Sequelize.INTEGER, // Dias de período gratuito
        allowNull: false,
        defaultValue: 0,
      },
      destaque: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      ordem_exibicao: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('planos');
  },
};
