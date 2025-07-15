#!/usr/bin/env node

import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

console.log('👤 Criando usuário administrador no banco de produção...\n');

// Conecta ao banco usando DATABASE_URL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

async function criarAdmin() {
  try {
    // Teste de conexão
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // Dados do administrador
    const adminData = {
      id: uuidv4(),
      nome: 'Administrador LoadTech',
      email: 'admin@loadtech.com.br',
      senha_hash: await bcrypt.hash('LoadTech@2025!', 12),
      telefone: '(11) 99999-9999',
      cpf_cnpj: '00000000000',
      papel: 'admin',
      status: 'ativo',
      email_verificado: true,
      created_at: new Date(),
      updated_at: new Date(),
      // Campos do Asaas (opcionais para admin)
      phone: '11999999999',
      mobile_phone: '11999999999',
      address: 'Rua da Tecnologia, 123',
      address_number: '123',
      complement: 'Sala 01',
      province: 'Centro',
      postal_code: '01000-000',
      notification_disabled: false,
      foreign_customer: false
    };

    // Verifica se já existe um usuário com este email
    const [existingUser] = await sequelize.query(
      'SELECT id FROM public.users WHERE email = :email',
      {
        replacements: { email: adminData.email },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (existingUser) {
      console.log('⚠️ Usuário administrador já existe!');
      console.log(`📧 Email: ${adminData.email}`);
      console.log(`🆔 ID: ${existingUser.id}\n`);
      
      // Atualiza a senha
      await sequelize.query(
        'UPDATE public.users SET senha_hash = :senha_hash, updated_at = :updated_at WHERE email = :email',
        {
          replacements: {
            senha_hash: adminData.senha_hash,
            updated_at: new Date(),
            email: adminData.email
          }
        }
      );
      
      console.log('🔑 Senha do administrador atualizada!');
      return;
    }

    // Insere o usuário administrador
    const query = `
      INSERT INTO public.users (
        id, nome, email, senha_hash, telefone, cpf_cnpj, 
        papel, status, email_verificado, 
        phone, mobile_phone, address, address_number, 
        complement, province, postal_code, notification_disabled, 
        foreign_customer, created_at, updated_at
      ) VALUES (
        :id, :nome, :email, :senha_hash, :telefone, :cpf_cnpj,
        :papel, :status, :email_verificado,
        :phone, :mobile_phone, :address, :address_number,
        :complement, :province, :postal_code, :notification_disabled,
        :foreign_customer, :created_at, :updated_at
      )
    `;

    await sequelize.query(query, {
      replacements: adminData
    });

    console.log('✅ Usuário administrador criado com sucesso!\n');
    console.log('📋 DADOS DO ADMINISTRADOR:');
    console.log('=' .repeat(50));
    console.log(`🆔 ID: ${adminData.id}`);
    console.log(`👤 Nome: ${adminData.nome}`);
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`🔑 Senha: LoadTech@2025!`);
    console.log(`📱 Telefone: ${adminData.telefone}`);
    console.log(`👑 Papel: ${adminData.papel}`);
    console.log(`✅ Status: ${adminData.status}`);

    // Verifica se foi inserido corretamente
    const [insertedUser] = await sequelize.query(
      'SELECT id, nome, email, papel, status FROM public.users WHERE email = :email',
      {
        replacements: { email: adminData.email },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (insertedUser) {
      console.log('\n🔍 VERIFICAÇÃO DA INSERÇÃO:');
      console.log('=' .repeat(50));
      console.log('✅ Usuário encontrado no banco!');
      console.log(`📧 Email: ${insertedUser.email}`);
      console.log(`👑 Papel: ${insertedUser.papel}`);
      console.log(`✅ Status: ${insertedUser.status}`);
    }

  } catch (error) {
    console.error('❌ Erro ao criar administrador:', error.message);
    if (error.parent) {
      console.error('Erro detalhado:', error.parent.message);
    }
  } finally {
    await sequelize.close();
    console.log('\n🔐 Conexão fechada.');
  }
}

// Executa a criação
criarAdmin();
