import { DataTypes } from 'sequelize';

export const up = async (queryInterface, Sequelize) => {
  // Adicionar campos para controle de avisos de remoção
  await queryInterface.addColumn('users', 'aviso_remocao_enviado', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica se o aviso de remoção da conta foi enviado'
  });

  await queryInterface.addColumn('users', 'data_aviso_remocao', {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data em que o aviso de remoção foi enviado'
  });

  console.log('✅ Campos de controle de remoção adicionados à tabela users');
};

export const down = async (queryInterface, Sequelize) => {
  // Remover os campos adicionados
  await queryInterface.removeColumn('users', 'aviso_remocao_enviado');
  await queryInterface.removeColumn('users', 'data_aviso_remocao');
  
  console.log('✅ Campos de controle de remoção removidos da tabela users');
};
