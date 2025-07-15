/**
 * Migration para adicionar campos básicos de integração com Asaas na tabela users
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'asaas_customer_id', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
      comment: 'ID do cliente no Asaas'
    });

    await queryInterface.addColumn('users', 'cpf_cnpj', {
      type: Sequelize.STRING(14),
      allowNull: true,
      comment: 'CPF ou CNPJ do usuário'
    });

    // Adicionar índice para performance
    await queryInterface.addIndex('users', ['asaas_customer_id'], {
      name: 'idx_users_asaas_customer_id'
    });

    await queryInterface.addIndex('users', ['cpf_cnpj'], {
      name: 'idx_users_cpf_cnpj'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('users', 'idx_users_cpf_cnpj');
    await queryInterface.removeIndex('users', 'idx_users_asaas_customer_id');
    await queryInterface.removeColumn('users', 'cpf_cnpj');
    await queryInterface.removeColumn('users', 'asaas_customer_id');
  }
};
