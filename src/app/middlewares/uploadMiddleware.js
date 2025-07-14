import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração de armazenamento local
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.uploadType || 'geral';
    const userId = req.user?.id; // ID do usuário logado
    let uploadPath;

    switch (uploadType) {
      case 'produto':
        // Produtos organizados por usuário: /uploads/produtos/{userId}/
        uploadPath = path.join(__dirname, '../../../public/uploads/produtos', userId || 'anonimo');
        break;
      case 'avatar':
        // Avatares organizados por usuário: /uploads/avatars/{userId}/
        uploadPath = path.join(__dirname, '../../../public/uploads/avatars', userId || 'anonimo');
        break;
      case 'logo':
        // Logos organizados por usuário: /uploads/logos/{userId}/
        uploadPath = path.join(__dirname, '../../../public/uploads/logos', userId || 'anonimo');
        break;
      case 'banner':
        // Banners organizados por usuário: /uploads/banners/{userId}/
        uploadPath = path.join(__dirname, '../../../public/uploads/banners', userId || 'anonimo');
        break;
      case 'documento':
        // Documentos organizados por usuário: /uploads/documentos/{userId}/
        uploadPath = path.join(__dirname, '../../../public/uploads/documentos', userId || 'anonimo');
        break;
      default:
        uploadPath = path.join(__dirname, '../../../public/uploads', userId || 'anonimo');
    }

    // Criar diretório se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uploadType = req.uploadType || 'geral';
    const userId = req.user?.id;
    const userName = req.user?.nome ? req.user.nome.toLowerCase().replace(/\s+/g, '-') : 'usuario';
    const fileExtension = path.extname(file.originalname);
    let fileName;

    switch (uploadType) {
      case 'avatar':
        // Avatar: {userId}-{nome}.jpg (substitui arquivo anterior)
        fileName = `${userId}-${userName}${fileExtension}`;
        break;
      case 'produto':
        // Produto: produto-{uuid}.jpg (múltiplos produtos por usuário)
        const produtoUuid = uuidv4();
        fileName = `produto-${produtoUuid}${fileExtension}`;
        break;
      case 'logo':
        // Logo da loja: logo-{userId}-{nome}.jpg (substitui arquivo anterior)
        fileName = `logo-${userId}-${userName}${fileExtension}`;
        break;
      case 'banner':
        // Banner da loja: banner-{userId}-{nome}.jpg (substitui arquivo anterior)
        fileName = `banner-${userId}-${userName}${fileExtension}`;
        break;
      case 'documento':
        // Documento: doc-{uuid}.pdf (múltiplos documentos por usuário)
        const docUuid = uuidv4();
        fileName = `doc-${docUuid}${fileExtension}`;
        break;
      default:
        const uniqueSuffix = uuidv4();
        fileName = `${uniqueSuffix}${fileExtension}`;
    }

    // Remover arquivo anterior para avatares, logos e banners (únicos por usuário)
    if (['avatar', 'logo', 'banner'].includes(uploadType) && userId) {
      const uploadPath = req.uploadPath || path.dirname(cb);
      const existingFiles = fs.existsSync(uploadPath) ? fs.readdirSync(uploadPath) : [];
      
      // Remover arquivo anterior com mesmo padrão
      existingFiles.forEach(existingFile => {
        if (existingFile.startsWith(`${uploadType === 'logo' ? 'logo-' : uploadType === 'banner' ? 'banner-' : ''}${userId}-`)) {
          const oldFilePath = path.join(uploadPath, existingFile);
          try {
            fs.unlinkSync(oldFilePath);
            console.log(`🗑️ Arquivo anterior removido: ${existingFile}`);
          } catch (error) {
            console.warn(`⚠️ Erro ao remover arquivo anterior: ${error.message}`);
          }
        }
      });
    }

    cb(null, fileName);
  }
});

// Filtro para validar tipos de arquivo
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];

  const allowedDocTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const uploadType = req.uploadType || 'geral';

  if (uploadType === 'documento') {
    if (allowedDocTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de documento não permitido. Use apenas PDF, DOC ou DOCX.'), false);
    }
  } else {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use apenas imagens.'), false);
    }
  }
};

// Configuração base do multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10, // Máximo 10 arquivos por vez
  },
});

// Middleware para definir tipo de upload
export const setUploadType = (type) => {
  return (req, res, next) => {
    req.uploadType = type;
    next();
  };
};

// Middleware para upload de uma única imagem
export const uploadSingle = (fieldName = 'image') => {
  return upload.single(fieldName);
};

// Middleware para upload de múltiplas imagens
export const uploadMultiple = (fieldName = 'images', maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

// Middleware para upload de campos específicos
export const uploadFields = (fields) => {
  return upload.fields(fields);
};

// Middleware para processar e otimizar imagens
export const processImages = (sizes = []) => {
  return async (req, res, next) => {
    try {
      if (!req.file && !req.files) {
        return next();
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      // Processar arquivo único
      if (req.file) {
        const processedFile = await processImageFile(req.file, sizes, baseUrl);
        req.uploadedFile = processedFile;
      }

      // Processar múltiplos arquivos
      if (req.files) {
        if (Array.isArray(req.files)) {
          // Array de arquivos
          req.uploadedFiles = await Promise.all(
            req.files.map(file => processImageFile(file, sizes, baseUrl))
          );
        } else {
          // Objeto com campos
          req.uploadedFiles = {};
          for (const [fieldName, files] of Object.entries(req.files)) {
            req.uploadedFiles[fieldName] = await Promise.all(
              files.map(file => processImageFile(file, sizes, baseUrl))
            );
          }
        }
      }

      next();
    } catch (error) {
      console.error('Erro no processamento de imagens:', error);
      res.status(500).json({
        erro: 'Erro no processamento de imagens',
        detalhes: error.message,
      });
    }
  };
};

// Função auxiliar para processar arquivo de imagem
async function processImageFile(file, sizes = [], baseUrl) {
  const result = {
    original: {
      filename: file.filename,
      path: file.path,
      url: `${baseUrl}/uploads/${path.basename(path.dirname(file.path))}/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    },
    sizes: {}
  };

  // Se não for imagem, retornar apenas o original
  if (!file.mimetype.startsWith('image/')) {
    return result;
  }

  // Processar diferentes tamanhos se especificado
  for (const sizeConfig of sizes) {
    const { name, width, height, quality = 80 } = sizeConfig;
    const sizePath = file.path.replace(
      path.extname(file.path),
      `_${name}${path.extname(file.path)}`
    );

    try {
      await sharp(file.path)
        .resize(width, height, { 
          fit: 'cover',
          withoutEnlargement: true 
        })
        .jpeg({ quality })
        .toFile(sizePath);

      result.sizes[name] = {
        filename: path.basename(sizePath),
        path: sizePath,
        url: `${baseUrl}/uploads/${path.basename(path.dirname(sizePath))}/${path.basename(sizePath)}`,
        width,
        height
      };
    } catch (error) {
      console.error(`Erro ao processar tamanho ${name}:`, error);
    }
  }

  return result;
}

// Middleware para validar tamanho e tipo específico
export const validateUpload = (maxSizeMB = 10, allowedTypes = ['jpeg', 'jpg', 'png']) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];

    for (const file of files) {
      // Validar tamanho
      if (file.size > maxSizeMB * 1024 * 1024) {
        return res.status(400).json({
          erro: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`,
        });
      }

      // Validar tipo
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        return res.status(400).json({
          erro: `Tipo de arquivo não permitido. Use: ${allowedTypes.join(', ')}`,
        });
      }
    }

    next();
  };
};

// Middleware de tratamento de erros para upload
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          erro: 'Arquivo muito grande',
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          erro: 'Muitos arquivos enviados',
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          erro: 'Campo de arquivo não esperado',
        });
      default:
        return res.status(400).json({
          erro: 'Erro no upload',
          detalhes: error.message,
        });
    }
  }

  if (error.message.includes('Tipo de arquivo não permitido')) {
    return res.status(400).json({
      erro: error.message,
    });
  }

  // Outros erros
  next(error);
};

export default {
  setUploadType,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  processImages,
  validateUpload,
  handleUploadError,
};
