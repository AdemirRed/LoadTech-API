export const up = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction();
  
  try {
    // Verificar quais campos já existem para evitar duplicação
    const tableDescription = await queryInterface.describeTable('users');
    
    const fieldsToAdd = [];
    
    // Lista completa de campos do Asaas com verificação
    const asaasFields = [
      // Campos básicos (alguns podem já existir)
      {
        name: 'phone',
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Telefone fixo do cliente'
      },
      {
        name: 'mobile_phone',
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Telefone celular do cliente'
      },
      {
        name: 'address',
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Logradouro do endereço'
      },
      {
        name: 'address_number',
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Número do endereço'
      },
      {
        name: 'complement',
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Complemento do endereço (máx. 255 caracteres)'
      },
      {
        name: 'province',
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Bairro'
      },
      {
        name: 'postal_code',
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'CEP do endereço'
      },
      {
        name: 'external_reference',
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Identificador do cliente no sistema externo'
      },
      {
        name: 'notification_disabled',
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        comment: 'Desabilitar notificações de cobrança'
      },
      {
        name: 'additional_emails',
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Emails adicionais para notificações (separados por vírgula)'
      },
      {
        name: 'municipal_inscription',
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Inscrição municipal do cliente'
      },
      {
        name: 'state_inscription',
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Inscrição estadual do cliente'
      },
      {
        name: 'observations',
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Observações adicionais'
      },
      {
        name: 'group_name',
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Nome do grupo ao qual o cliente pertence'
      },
      {
        name: 'company',
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Empresa do cliente'
      },
      {
        name: 'foreign_customer',
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        comment: 'Cliente estrangeiro'
      },
      // Campos de upload de imagens
      {
        name: 'avatar_url',
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'URL do avatar/foto de perfil do usuário'
      },
      {
        name: 'logo_url',
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'URL da logo da loja do usuário'
      }
    ];
    
    // Verificar quais campos não existem e precisam ser adicionados
    for (const field of asaasFields) {
      if (!tableDescription[field.name]) {
        fieldsToAdd.push(field);
      }
    }
    
    console.log(`📝 Adicionando ${fieldsToAdd.length} novos campos à tabela users`);
    
    // Adicionar campos que não existem
    for (const field of fieldsToAdd) {
      console.log(`➕ Adicionando campo: ${field.name}`);
      await queryInterface.addColumn('users', field.name, {
        type: field.type,
        allowNull: field.allowNull,
        defaultValue: field.defaultValue,
        comment: field.comment
      }, { transaction });
    }
    
    await transaction.commit();
    console.log('✅ Migração concluída com sucesso!');
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Erro na migração:', error);
    throw error;
  }
};

export const down = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction();
  
  try {
    // Lista de campos para remover (ordem inversa)
    const fieldsToRemove = [
      'logo_url',
      'avatar_url',
      'foreign_customer',
      'company',
      'group_name',
      'observations',
      'state_inscription',
      'municipal_inscription',
      'additional_emails',
      'notification_disabled',
      'external_reference',
      'postal_code',
      'province',
      'complement',
      'address_number',
      'address',
      'mobile_phone',
      'phone'
    ];
    
    for (const fieldName of fieldsToRemove) {
      try {
        await queryInterface.removeColumn('users', fieldName, { transaction });
        console.log(`➖ Campo removido: ${fieldName}`);
      } catch (error) {
        console.warn(`⚠️ Campo ${fieldName} não encontrado para remoção`);
      }
    }
    
    await transaction.commit();
    console.log('✅ Rollback concluído com sucesso!');
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Erro no rollback:', error);
    throw error;
  }
};
