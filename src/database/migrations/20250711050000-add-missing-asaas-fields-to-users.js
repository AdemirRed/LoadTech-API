import { DataTypes } from 'sequelize';

export async function up(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  
  try {
    // Verificar quais campos já existem para evitar duplicação
    const tableDescription = await queryInterface.describeTable('users');
    
    // Lista de campos para adicionar
    const fieldsToAdd = [
      {
        name: 'phone',
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Telefone fixo'
      },
      {
        name: 'mobile_phone',
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Telefone celular'
      },
      {
        name: 'address',
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Logradouro'
      },
      {
        name: 'address_number',
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Número do endereço'
      },
      {
        name: 'complement',
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Complemento do endereço'
      },
      {
        name: 'province',
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Bairro'
      },
      {
        name: 'postal_code',
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'CEP'
      },
      {
        name: 'external_reference',
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Referência externa no sistema'
      },
      {
        name: 'notification_disabled',
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        comment: 'Desabilitar notificações'
      },
      {
        name: 'additional_emails',
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Emails adicionais separados por vírgula'
      },
      {
        name: 'municipal_inscription',
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Inscrição municipal'
      },
      {
        name: 'state_inscription',
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Inscrição estadual'
      },
      {
        name: 'observations',
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Observações adicionais'
      },
      {
        name: 'group_name',
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Nome do grupo'
      },
      {
        name: 'company',
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Empresa'
      },
      {
        name: 'foreign_customer',
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        comment: 'Cliente estrangeiro'
      },
      {
        name: 'avatar_url',
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'URL do avatar do usuário'
      },
      {
        name: 'logo_url',
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'URL do logo da loja'
      }
    ];
    
    // Adicionar apenas campos que não existem
    for (const field of fieldsToAdd) {
      if (!tableDescription[field.name]) {
        console.log(`Adicionando campo: ${field.name}`);
        await queryInterface.addColumn('users', field.name, {
          type: field.type,
          allowNull: field.allowNull,
          defaultValue: field.defaultValue,
          comment: field.comment
        }, { transaction });
      } else {
        console.log(`Campo ${field.name} já existe, pulando...`);
      }
    }
    
    await transaction.commit();
    console.log('✅ Campos do Asaas adicionados com sucesso!');
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Erro ao adicionar campos:', error);
    throw error;
  }
}

export async function down(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  
  try {
    // Lista de campos para remover
    const fieldsToRemove = [
      'phone',
      'mobile_phone', 
      'address',
      'address_number',
      'complement',
      'province',
      'postal_code',
      'external_reference',
      'notification_disabled',
      'additional_emails',
      'municipal_inscription',
      'state_inscription',
      'observations',
      'group_name',
      'company',
      'foreign_customer',
      'avatar_url',
      'logo_url'
    ];
    
    // Verificar quais campos existem antes de remover
    const tableDescription = await queryInterface.describeTable('users');
    
    for (const fieldName of fieldsToRemove) {
      if (tableDescription[fieldName]) {
        console.log(`Removendo campo: ${fieldName}`);
        await queryInterface.removeColumn('users', fieldName, { transaction });
      }
    }
    
    await transaction.commit();
    console.log('✅ Campos removidos com sucesso!');
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Erro ao remover campos:', error);
    throw error;
  }
}
