import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  // Adicionar todos os campos do Asaas Customer na tabela users
  // (cpf_cnpj já existe na migração anterior, então não adicionamos novamente)

  await queryInterface.addColumn('users', 'phone', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Telefone fixo do cliente'
  });

  await queryInterface.addColumn('users', 'mobile_phone', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Telefone celular do cliente'
  });

  await queryInterface.addColumn('users', 'address', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Logradouro do endereço'
  });

  await queryInterface.addColumn('users', 'address_number', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Número do endereço'
  });

  await queryInterface.addColumn('users', 'complement', {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Complemento do endereço (máx. 255 caracteres)'
  });

  await queryInterface.addColumn('users', 'province', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Bairro'
  });

  await queryInterface.addColumn('users', 'postal_code', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'CEP do endereço'
  });

  await queryInterface.addColumn('users', 'external_reference', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Identificador do cliente no nosso sistema'
  });

  await queryInterface.addColumn('users', 'notification_disabled', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    comment: 'true para desabilitar notificações de cobrança'
  });

  await queryInterface.addColumn('users', 'additional_emails', {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Emails adicionais para notificações separados por vírgula'
  });

  await queryInterface.addColumn('users', 'municipal_inscription', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Inscrição municipal do cliente'
  });

  await queryInterface.addColumn('users', 'state_inscription', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Inscrição estadual do cliente'
  });

  await queryInterface.addColumn('users', 'observations', {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Observações adicionais sobre o cliente'
  });

  await queryInterface.addColumn('users', 'group_name', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nome do grupo ao qual o cliente pertence'
  });

  await queryInterface.addColumn('users', 'company', {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nome da empresa do cliente'
  });

  await queryInterface.addColumn('users', 'foreign_customer', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    comment: 'true caso seja pagador estrangeiro'
  });

  // Adicionar índices para melhorar performance
  // (cpf_cnpj já tem índice na migração anterior)
  
  await queryInterface.addIndex('users', ['external_reference'], {
    name: 'users_external_reference_idx'
  });

  await queryInterface.addIndex('users', ['postal_code'], {
    name: 'users_postal_code_idx'
  });

  console.log('✅ Campos do Asaas Customer adicionados na tabela users');
}

export async function down(queryInterface, Sequelize) {
  // Remover índices
  await queryInterface.removeIndex('users', 'users_external_reference_idx');
  await queryInterface.removeIndex('users', 'users_postal_code_idx');

  // Remover colunas (cpf_cnpj não removemos pois está em outra migração)
  await queryInterface.removeColumn('users', 'phone');
  await queryInterface.removeColumn('users', 'phone');
  await queryInterface.removeColumn('users', 'mobile_phone');
  await queryInterface.removeColumn('users', 'address');
  await queryInterface.removeColumn('users', 'address_number');
  await queryInterface.removeColumn('users', 'complement');
  await queryInterface.removeColumn('users', 'province');
  await queryInterface.removeColumn('users', 'postal_code');
  await queryInterface.removeColumn('users', 'external_reference');
  await queryInterface.removeColumn('users', 'notification_disabled');
  await queryInterface.removeColumn('users', 'additional_emails');
  await queryInterface.removeColumn('users', 'municipal_inscription');
  await queryInterface.removeColumn('users', 'state_inscription');
  await queryInterface.removeColumn('users', 'observations');
  await queryInterface.removeColumn('users', 'group_name');
  await queryInterface.removeColumn('users', 'company');
  await queryInterface.removeColumn('users', 'foreign_customer');

  console.log('✅ Campos do Asaas Customer removidos da tabela users');
}
