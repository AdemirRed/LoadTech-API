const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
  // Verificar quais campos já existem para evitar duplicação
  const tableDescription = await queryInterface.describeTable('users');
  
  console.log('📝 Verificando campos existentes na tabela users...');
  
  // Adicionar apenas campos que não existem
  if (!tableDescription.phone) {
    console.log('➕ Adicionando campo phone');
    await queryInterface.addColumn('users', 'phone', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Telefone fixo do cliente'
    });
  } else {
    console.log('⏭️ Campo phone já existe');
  }

  if (!tableDescription.mobile_phone) {
    console.log('➕ Adicionando campo mobile_phone');
    await queryInterface.addColumn('users', 'mobile_phone', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Telefone celular do cliente'
    });
  } else {
    console.log('⏭️ Campo mobile_phone já existe');
  }

  if (!tableDescription.address) {
    console.log('➕ Adicionando campo address');
    await queryInterface.addColumn('users', 'address', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Logradouro do endereço'
    });
  } else {
    console.log('⏭️ Campo address já existe');
  }

  if (!tableDescription.address_number) {
    console.log('➕ Adicionando campo address_number');
    await queryInterface.addColumn('users', 'address_number', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Número do endereço'
    });
  } else {
    console.log('⏭️ Campo address_number já existe');
  }

  if (!tableDescription.complement) {
    console.log('➕ Adicionando campo complement');
    await queryInterface.addColumn('users', 'complement', {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Complemento do endereço (máx. 255 caracteres)'
    });
  } else {
    console.log('⏭️ Campo complement já existe');
  }

  if (!tableDescription.province) {
    console.log('➕ Adicionando campo province');
    await queryInterface.addColumn('users', 'province', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Bairro'
    });
  } else {
    console.log('⏭️ Campo province já existe');
  }

  if (!tableDescription.postal_code) {
    console.log('➕ Adicionando campo postal_code');
    await queryInterface.addColumn('users', 'postal_code', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'CEP do endereço'
    });
  } else {
    console.log('⏭️ Campo postal_code já existe');
  }

  if (!tableDescription.external_reference) {
    console.log('➕ Adicionando campo external_reference');
    await queryInterface.addColumn('users', 'external_reference', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Identificador do cliente no nosso sistema'
    });
  } else {
    console.log('⏭️ Campo external_reference já existe');
  }

  if (!tableDescription.notification_disabled) {
    console.log('➕ Adicionando campo notification_disabled');
    await queryInterface.addColumn('users', 'notification_disabled', {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: 'true para desabilitar notificações de cobrança'
    });
  } else {
    console.log('⏭️ Campo notification_disabled já existe');
  }

  if (!tableDescription.additional_emails) {
    console.log('➕ Adicionando campo additional_emails');
    await queryInterface.addColumn('users', 'additional_emails', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Emails adicionais para notificações separados por vírgula'
    });
  } else {
    console.log('⏭️ Campo additional_emails já existe');
  }

  if (!tableDescription.municipal_inscription) {
    console.log('➕ Adicionando campo municipal_inscription');
    await queryInterface.addColumn('users', 'municipal_inscription', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Inscrição municipal do cliente'
    });
  } else {
    console.log('⏭️ Campo municipal_inscription já existe');
  }

  if (!tableDescription.state_inscription) {
    console.log('➕ Adicionando campo state_inscription');
    await queryInterface.addColumn('users', 'state_inscription', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Inscrição estadual do cliente'
    });
  } else {
    console.log('⏭️ Campo state_inscription já existe');
  }

  if (!tableDescription.observations) {
    console.log('➕ Adicionando campo observations');
    await queryInterface.addColumn('users', 'observations', {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Observações adicionais sobre o cliente'
    });
  } else {
    console.log('⏭️ Campo observations já existe');
  }

  if (!tableDescription.group_name) {
    console.log('➕ Adicionando campo group_name');
    await queryInterface.addColumn('users', 'group_name', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Nome do grupo ao qual o cliente pertence'
    });
  } else {
    console.log('⏭️ Campo group_name já existe');
  }

  if (!tableDescription.company) {
    console.log('➕ Adicionando campo company');
    await queryInterface.addColumn('users', 'company', {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Nome da empresa do cliente'
    });
  } else {
    console.log('⏭️ Campo company já existe');
  }

  if (!tableDescription.foreign_customer) {
    console.log('➕ Adicionando campo foreign_customer');
    await queryInterface.addColumn('users', 'foreign_customer', {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: 'true caso seja pagador estrangeiro'
    });
  } else {
    console.log('⏭️ Campo foreign_customer já existe');
  }

  // Contar quantos campos foram adicionados
  const finalTableDescription = await queryInterface.describeTable('users');
  const fieldsAdded = Object.keys(finalTableDescription).length - Object.keys(tableDescription).length;
  
  console.log(`📝 Adicionando ${fieldsAdded} novos campos à tabela users`);
  console.log('✅ Migração concluída com sucesso!');

  // Adicionar índices para melhorar performance (verificando se já existem)
  // (cpf_cnpj já tem índice na migração anterior)
  
  try {
    await queryInterface.addIndex('users', ['external_reference'], {
      name: 'users_external_reference_idx'
    });
    console.log('➕ Índice users_external_reference_idx criado');
  } catch (error) {
    console.log('⏭️ Índice users_external_reference_idx já existe');
  }

  try {
    await queryInterface.addIndex('users', ['postal_code'], {
      name: 'users_postal_code_idx'
    });
    console.log('➕ Índice users_postal_code_idx criado');
  } catch (error) {
    console.log('⏭️ Índice users_postal_code_idx já existe');
  }

  console.log('✅ Campos do Asaas Customer adicionados na tabela users');
  },

  down: async (queryInterface, Sequelize) => {
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
};
