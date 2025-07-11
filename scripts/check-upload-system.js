#!/usr/bin/env node

/**
 * Script para verificar o sistema de upload
 * Verifica se todas as pastas estão criadas e os middlewares funcionando
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkUploadSystem() {
  console.log('🔍 Verificando sistema de upload...\n');
  
  const projectRoot = path.join(__dirname, '..');
  const uploadBasePath = path.join(projectRoot, 'public/uploads');
  const uploadFolders = ['produtos', 'avatars', 'logos', 'banners', 'documentos'];
  
  let allGood = true;
  
  // Verificar pasta base
  console.log('📁 Verificando pasta base de uploads...');
  if (fs.existsSync(uploadBasePath)) {
    console.log(`   ✅ ${uploadBasePath} existe`);
  } else {
    console.log(`   ❌ ${uploadBasePath} não existe`);
    allGood = false;
  }
  
  // Verificar subpastas
  console.log('\n📁 Verificando subpastas de upload...');
  uploadFolders.forEach(folder => {
    const folderPath = path.join(uploadBasePath, folder);
    const gitkeepPath = path.join(folderPath, '.gitkeep');
    
    if (fs.existsSync(folderPath)) {
      console.log(`   ✅ uploads/${folder} existe`);
      
      if (fs.existsSync(gitkeepPath)) {
        console.log(`   ✅ uploads/${folder}/.gitkeep existe`);
      } else {
        console.log(`   ⚠️  uploads/${folder}/.gitkeep não existe`);
      }
    } else {
      console.log(`   ❌ uploads/${folder} não existe`);
      allGood = false;
    }
  });
  
  // Verificar arquivos principais
  console.log('\n📄 Verificando arquivos do sistema...');
  const requiredFiles = [
    'src/app/middlewares/uploadMiddleware.js',
    'src/app/controllers/UploadController.js',
    'package.json',
    '.gitignore'
  ];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file} existe`);
    } else {
      console.log(`   ❌ ${file} não existe`);
      allGood = false;
    }
  });
  
  // Verificar dependências
  console.log('\n📦 Verificando dependências...');
  try {
    const packagePath = path.join(projectRoot, 'package.json');
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const dependencies = { ...packageContent.dependencies, ...packageContent.devDependencies };
    
    const requiredDeps = ['multer', 'sharp'];
    requiredDeps.forEach(dep => {
      if (dependencies[dep]) {
        console.log(`   ✅ ${dep} instalado (${dependencies[dep]})`);
      } else {
        console.log(`   ❌ ${dep} não instalado`);
        allGood = false;
      }
    });
  } catch (error) {
    console.log(`   ❌ Erro ao verificar package.json: ${error.message}`);
    allGood = false;
  }
  
  // Verificar .gitignore
  console.log('\n🔒 Verificando configuração do Git...');
  try {
    const gitignorePath = path.join(projectRoot, '.gitignore');
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    
    if (gitignoreContent.includes('public/uploads/*')) {
      console.log('   ✅ .gitignore configurado para uploads');
    } else {
      console.log('   ⚠️  .gitignore pode não estar configurado corretamente para uploads');
    }
    
    if (gitignoreContent.includes('!public/uploads/**/.gitkeep')) {
      console.log('   ✅ .gitignore permite .gitkeep');
    } else {
      console.log('   ⚠️  .gitignore pode não permitir .gitkeep');
    }
  } catch (error) {
    console.log(`   ❌ Erro ao verificar .gitignore: ${error.message}`);
  }
  
  // Resultado final
  console.log('\n' + '='.repeat(50));
  if (allGood) {
    console.log('🎉 SISTEMA DE UPLOAD OK!');
    console.log('📝 Próximos passos:');
    console.log('   1. npm start para iniciar o servidor');
    console.log('   2. Acessar http://localhost:3000/health para testar');
    console.log('   3. Acessar http://localhost:3000/uploads/health para testar uploads');
    console.log('   4. Usar test-upload-frontend.html para testar interface');
  } else {
    console.log('❌ PROBLEMAS ENCONTRADOS!');
    console.log('📝 Execute npm run setup ou crie manualmente as pastas/arquivos em falta');
  }
  console.log('='.repeat(50));
}

// Executar verificação
checkUploadSystem();
