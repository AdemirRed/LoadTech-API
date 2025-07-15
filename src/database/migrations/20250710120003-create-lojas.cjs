module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('lojas', {
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
      nome_loja: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      logo_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      banner_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      tema_cor_primaria: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '#007bff',
      },
      tema_cor_secundaria: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '#6c757d',
      },
      endereco: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      telefone_loja: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email_loja: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      whatsapp: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      redes_sociais: {
        type: Sequelize.JSON, // {instagram: '', facebook: '', twitter: ''}
        allowNull: true,
      },
      configuracoes_pagamento: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('ativa', 'inativa', 'suspensa'),
        allowNull: false,
        defaultValue: 'ativa',
      },
      dominio_personalizado: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      certificado_ssl: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      analytics_code: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      seo_titulo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      seo_descricao: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      seo_palavras_chave: {
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

    // Índices
    await queryInterface.addIndex('lojas', ['user_id']);
    await queryInterface.addIndex('lojas', ['slug']);
    await queryInterface.addIndex('lojas', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('lojas');
  },
};
