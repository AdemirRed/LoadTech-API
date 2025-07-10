module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
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
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      senha_hash: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      telefone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      papel: {
        type: Sequelize.ENUM('admin', 'usuario'),
        allowNull: false,
        defaultValue: 'usuario',
      },
      status: {
        type: Sequelize.ENUM('ativo', 'inativo', 'pendente'),
        allowNull: false,
        defaultValue: 'pendente',
      },
      email_verificado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      codigo_verificacao: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      codigo_verificacao_expiracao: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      codigo_recuperacao: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      codigo_recuperacao_expiracao: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      tentativas_recuperacao: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      ultima_tentativa_recuperacao: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      ultimo_login: {
        type: Sequelize.DATE,
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  },
};
