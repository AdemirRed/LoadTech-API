import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UploadController {
  // Upload de imagem de produto
  async uploadProductImage(req, res) {
    try {
      const { produtoId } = req.params;
      const userId = req.user.id;
      const lojaId = req.user.loja?.id;

      if (!lojaId) {
        return res.status(400).json({
          erro: 'Usuário não possui loja vinculada',
        });
      }

      if (!req.uploadedFile) {
        return res.status(400).json({
          erro: 'Nenhuma imagem foi enviada',
        });
      }

      // Construir URL correta do produto (incluindo subpasta do usuário)
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const imagemUrl = `${baseUrl}/uploads/produtos/${userId}/${req.uploadedFile.original.filename}`;

      // Aqui você pode salvar as URLs no banco de dados
      // Exemplo: await Produto.update({ imagens: imagemUrl }, { where: { id: produtoId } });

      res.json({
        mensagem: 'Imagem do produto enviada com sucesso',
        produto_id: produtoId,
        user_id: userId,
        loja_id: lojaId,
        imagem_url: imagemUrl,
        arquivo: {
          ...req.uploadedFile,
          // Garantir que a URL retornada esteja correta
          original: {
            ...req.uploadedFile.original,
            url: imagemUrl
          }
        },
      });
    } catch (error) {
      console.error('Erro no upload de imagem do produto:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
      });
    }
  }

  // Upload de logo da loja
  async uploadLojaLogo(req, res) {
    try {
      const userId = req.user.id;
      const lojaId = req.user.loja?.id;

      if (!req.uploadedFile) {
        return res.status(400).json({
          erro: 'Nenhuma imagem foi enviada',
        });
      }

      // Construir URL correta do logo (incluindo subpasta do usuário)
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const logoUrl = `${baseUrl}/uploads/logos/${userId}/${req.uploadedFile.original.filename}`;
      
      await User.update(
        { logo_url: logoUrl },
        { where: { id: userId } }
      );

      console.log(`✅ Logo da loja atualizado para usuário ${userId}: ${logoUrl}`);

      res.json({
        mensagem: 'Logo da loja enviado com sucesso',
        user_id: userId,
        loja_id: lojaId,
        logo_url: logoUrl,
        arquivo: {
          ...req.uploadedFile,
          // Garantir que a URL retornada esteja correta
          original: {
            ...req.uploadedFile.original,
            url: logoUrl
          }
        },
      });
    } catch (error) {
      console.error('Erro no upload de logo da loja:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
      });
    }
  }

  // Upload de banner da loja
  async uploadLojaBanner(req, res) {
    try {
      const userId = req.user.id;
      const lojaId = req.user.loja?.id;

      if (!lojaId) {
        return res.status(400).json({
          erro: 'Usuário não possui loja vinculada',
        });
      }

      if (!req.uploadedFile) {
        return res.status(400).json({
          erro: 'Nenhuma imagem foi enviada',
        });
      }

      // Construir URL correta do banner (incluindo subpasta do usuário)
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const bannerUrl = `${baseUrl}/uploads/banners/${userId}/${req.uploadedFile.original.filename}`;

      // Aqui você pode atualizar o banner da loja no banco
      // Exemplo: await Loja.update({ banner: bannerUrl }, { where: { id: lojaId } });

      res.json({
        mensagem: 'Banner da loja enviado com sucesso',
        user_id: userId,
        loja_id: lojaId,
        banner_url: bannerUrl,
        arquivo: {
          ...req.uploadedFile,
          // Garantir que a URL retornada esteja correta
          original: {
            ...req.uploadedFile.original,
            url: bannerUrl
          }
        },
      });
    } catch (error) {
      console.error('Erro no upload de banner da loja:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
      });
    }
  }

  // Upload de avatar do usuário
  async uploadUserAvatar(req, res) {
    try {
      const userId = req.user.id;

      if (!req.uploadedFile) {
        return res.status(400).json({
          erro: 'Nenhuma imagem foi enviada',
        });
      }

      // Construir URL correta do avatar (incluindo subpasta do usuário)
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const avatarUrl = `${baseUrl}/uploads/avatars/${userId}/${req.uploadedFile.original.filename}`;
      
      // Buscar dados completos do usuário para sincronização
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }
      
      // Atualizar avatar no banco
      await user.update({ avatar_url: avatarUrl });

      console.log(`✅ Avatar atualizado para usuário ${userId}: ${avatarUrl}`);

      // 🔥 SINCRONIZAR COM ASAAS APÓS UPLOAD DE AVATAR
      if (user.asaas_customer_id) {
        try {
          console.log('🔄 Sincronizando avatar com Asaas...');
          
          // Importar AsaasClient dinamicamente para evitar dependência circular
          const { default: AsaasClient } = await import('../../services/AsaasClient.js');
          
          // Note: Asaas não suporta campo de avatar/imagem diretamente
          // Mas podemos incluir a URL nas observações ou usar um campo customizado
          const observationsWithAvatar = user.observations 
            ? `${user.observations}\n\nAvatar: ${avatarUrl}`
            : `Avatar: ${avatarUrl}`;

          await AsaasClient.updateCustomer(user.asaas_customer_id, {
            observations: observationsWithAvatar
          });

          console.log('✅ Avatar sincronizado com Asaas nas observações');
        } catch (asaasError) {
          console.warn('⚠️ Falha na sincronização do avatar com Asaas:', asaasError.message);
          // Não falha o upload por erro no Asaas
        }
      }

      res.json({
        mensagem: 'Avatar do usuário enviado com sucesso',
        user_id: userId,
        avatar_url: avatarUrl,
        arquivo: {
          ...req.uploadedFile,
          // Garantir que a URL retornada esteja correta
          original: {
            ...req.uploadedFile.original,
            url: avatarUrl
          }
        },
      });
    } catch (error) {
      console.error('Erro no upload de avatar do usuário:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
      });
    }
  }

  // Upload de múltiplas imagens
  async uploadMultipleImages(req, res) {
    try {
      if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
        return res.status(400).json({
          erro: 'Nenhuma imagem foi enviada',
        });
      }

      res.json({
        mensagem: 'Imagens enviadas com sucesso',
        total: req.uploadedFiles.length,
        arquivos: req.uploadedFiles,
      });
    } catch (error) {
      console.error('Erro no upload de múltiplas imagens:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
      });
    }
  }

  // Upload de documento
  async uploadDocument(req, res) {
    try {
      const userId = req.user.id;

      if (!req.uploadedFile) {
        return res.status(400).json({
          erro: 'Nenhum documento foi enviado',
        });
      }

      // Construir URL correta do documento (incluindo subpasta do usuário)
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const documentoUrl = `${baseUrl}/uploads/documentos/${userId}/${req.uploadedFile.original.filename}`;

      res.json({
        mensagem: 'Documento enviado com sucesso',
        user_id: userId,
        documento_url: documentoUrl,
        arquivo: {
          ...req.uploadedFile,
          // Garantir que a URL retornada esteja correta
          original: {
            ...req.uploadedFile.original,
            url: documentoUrl
          }
        },
      });
    } catch (error) {
      console.error('Erro no upload de documento:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
      });
    }
  }

  // Listar arquivos de uma loja
  async listLojaFiles(req, res) {
    try {
      const userId = req.user.id;
      const lojaId = req.user.loja?.id;

      if (!lojaId) {
        return res.status(400).json({
          erro: 'Usuário não possui loja vinculada',
        });
      }

      // Listar arquivos organizados por usuário
      const uploadsPath = path.join(__dirname, '../../../public/uploads');
      const folders = ['produtos', 'avatars', 'logos', 'banners', 'documentos'];
      const files = {};
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      for (const folder of folders) {
        const userFolderPath = path.join(uploadsPath, folder, userId.toString());
        if (fs.existsSync(userFolderPath)) {
          files[folder] = fs.readdirSync(userFolderPath).map(filename => ({
            filename,
            url: `${baseUrl}/uploads/${folder}/${userId}/${filename}`,
            size: fs.statSync(path.join(userFolderPath, filename)).size,
            modified: fs.statSync(path.join(userFolderPath, filename)).mtime
          }));
        } else {
          files[folder] = [];
        }
      }

      res.json({
        mensagem: 'Arquivos da loja listados com sucesso',
        user_id: userId,
        loja_id: lojaId,
        arquivos: files,
      });
    } catch (error) {
      console.error('Erro ao listar arquivos da loja:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
      });
    }
  }

  // Deletar arquivo
  async deleteFile(req, res) {
    try {
      const { filename, folder } = req.body;

      if (!filename || !folder) {
        return res.status(400).json({
          erro: 'Nome do arquivo e pasta são obrigatórios',
        });
      }

      const filePath = path.join(__dirname, '../../../public/uploads', folder, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          erro: 'Arquivo não encontrado',
        });
      }

      fs.unlinkSync(filePath);

      // Deletar também os tamanhos redimensionados se existirem
      const fileExt = path.extname(filename);
      const fileBase = path.basename(filename, fileExt);
      const folderPath = path.dirname(filePath);
      
      const files = fs.readdirSync(folderPath);
      files.forEach(file => {
        if (file.startsWith(fileBase + '_') && file.endsWith(fileExt)) {
          fs.unlinkSync(path.join(folderPath, file));
        }
      });

      res.json({
        mensagem: 'Arquivo deletado com sucesso',
        filename,
        folder,
      });
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
      });
    }
  }

  // Estatísticas de uso
  async getUsageStats(req, res) {
    try {
      const userId = req.user.id;
      const uploadsPath = path.join(__dirname, '../../../public/uploads');
      const folders = ['produtos', 'avatars', 'logos', 'banners', 'documentos'];
      const stats = {};

      let totalSize = 0;
      let totalFiles = 0;

      for (const folder of folders) {
        const userFolderPath = path.join(uploadsPath, folder, userId.toString());
        if (fs.existsSync(userFolderPath)) {
          const files = fs.readdirSync(userFolderPath);
          let folderSize = 0;

          files.forEach(filename => {
            const filePath = path.join(userFolderPath, filename);
            const fileStat = fs.statSync(filePath);
            folderSize += fileStat.size;
          });

          stats[folder] = {
            files: files.length,
            size: folderSize,
            sizeFormatted: formatBytes(folderSize)
          };

          totalFiles += files.length;
          totalSize += folderSize;
        } else {
          stats[folder] = {
            files: 0,
            size: 0,
            sizeFormatted: '0 B'
          };
        }
      }

      res.json({
        mensagem: 'Estatísticas de uso obtidas com sucesso',
        user_id: userId,
        total: {
          files: totalFiles,
          size: totalSize,
          sizeFormatted: formatBytes(totalSize)
        },
        folders: stats,
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        erro: 'Erro interno do servidor',
      });
    }
  }

  // Informações do sistema de upload
  async info(req, res) {
    res.json({
      mensagem: 'Sistema de upload local ativo',
      status: 'funcionando',
      versao: '1.0.0',
      tipos_suportados: {
        imagens: ['jpeg', 'jpg', 'png', 'webp', 'gif'],
        documentos: ['pdf', 'doc', 'docx']
      },
      tamanho_maximo: '10MB',
      pastas_upload: ['produtos', 'avatars', 'logos', 'banners', 'documentos'],
      url_base: `${req.protocol}://${req.get('host')}/uploads`
    });
  }
}

// Função auxiliar para formatar bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default new UploadController();
