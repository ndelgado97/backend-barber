import express from 'express';
import {
  registrarBarbero,
  loginBarbero,
  obtenerPerfilBarbero,
  actualizarPerfilBarbero,
  suscribirse,
} from './barberos.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import { check } from 'express-validator';
import validarCampos from '../../middlewares/validarCampos.js';
import multer from 'multer';

// Configuración de Multer para la subida de archivos en memoria
const storage = multer.memoryStorage();

// Filtros para tipos de archivos permitidos
const fileFilter = (req, file, cb) => {
  // Permitir solo imágenes y PDFs para documentos de identidad
  if (
    file.fieldname === 'profilePicture' &&
    (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png')
  ) {
    cb(null, true);
  } else if (
    file.fieldname === 'documentoIdentidad' &&
    (file.mimetype === 'application/pdf' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no soportado'), false);
  }
};

// Inicializar Multer con la configuración de almacenamiento y filtros
const upload = multer({ storage, fileFilter });

const router = express.Router();

/**
 * @route   POST /api/barberos/register
 * @desc    Registrar un nuevo barbero
 * @access  Público
 */
router.post(
  '/register',
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'documentoIdentidad', maxCount: 1 },
  ]),
  [
    check('name', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'Por favor, incluye un email válido').isEmail(),
    check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
    // Otros checks según sea necesario
  ],
  validarCampos, // Middleware para manejar errores de validación
  registrarBarbero
);

/**
 * @route   POST /api/barberos/login
 * @desc    Iniciar sesión como barbero
 * @access  Público
 */
router.post(
  '/login',
  [
    check('email', 'Por favor, incluye un email válido').isEmail(),
    check('password', 'La contraseña es obligatoria').exists(),
  ],
  validarCampos, // Middleware para manejar errores de validación
  loginBarbero
);

/**
 * @route   GET /api/barberos/profile
 * @desc    Obtener el perfil del barbero autenticado
 * @access  Privado
 */
router.get('/profile', authMiddleware, obtenerPerfilBarbero);

/**
 * @route   PUT /api/barberos/profile
 * @desc    Actualizar el perfil del barbero autenticado
 * @access  Privado
 */
router.put(
  '/profile',
  authMiddleware,
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'documentoIdentidad', maxCount: 1 },
  ]),
  [
    check('email', 'Por favor, incluye un email válido').optional().isEmail(),
    check('password', 'La contraseña debe tener al menos 6 caracteres').optional().isLength({ min: 6 }),
    // Otros checks según sea necesario
  ],
  validarCampos, // Middleware para manejar errores de validación
  actualizarPerfilBarbero
);

/**
 * @route   POST /api/barberos/suscribirse
 * @desc    Suscribirse al sistema
 * @access  Privado
 */
router.post(
  '/suscribirse',
  authMiddleware,
  [
    check('suscripcionId', 'ID de suscripción es obligatorio').isMongoId(),
  ],
  validarCampos, // Middleware para manejar errores de validación
  suscribirse
);

// Middleware para manejar errores de Multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Errores de Multer
    return res.status(400).json({
      success: false,
      message: 'Error en la subida de archivos',
      errors: [{ file: err.message }],
    });
  } else if (err) {
    // Otros errores
    return res.status(400).json({
      success: false,
      message: 'Error en la subida de archivos',
      errors: [{ file: err.message }],
    });
  }
  next();
});

export default router;
