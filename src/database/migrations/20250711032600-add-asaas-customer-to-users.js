/**
 * Migration para adicionar campo asaas_customer_id na tabela users
 */

export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('users', 'asaas_customer_id', {
    type: Sequelize.STRING,
    allowNull: true,
    unique: true,
    comment: 'ID do cliente no Asaas'
  });

  await queryInterface.addColumn('users', 'cpf_cnpj', {
    type: Sequelize.STRING,
    allowNull: true,
    comment: 'CPF ou CNPJ do usuário'
  });

  // Adicionar índice para performance
  await queryInterface.addIndex('users', ['asaas_customer_id'], {
    name: 'idx_users_asaas_customer_id'
  });
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.removeIndex('users', 'idx_users_asaas_customer_id');
  await queryInterface.removeColumn('users', 'cpf_cnpj');
  await queryInterface.removeColumn('users', 'asaas_customer_id');
};
