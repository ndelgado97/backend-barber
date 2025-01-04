import express from 'express';
import {
  registrarCliente,
  loginCliente,
  obtenerPerfilCliente,
  actualizarPerfilCliente,
} from './clientes.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import { check } from 'express-validator';
import validarCampos from '../../middlewares/validarCampos.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configuración de Multer para la subida de archivos (perfil)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Definir la carpeta para las fotos de perfil
    if (file.fieldname === 'profilePicture') {
      cb(null, 'uploads/profilePictures/');
    } else {
      cb(new Error('Campo de archivo no soportado'), false);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Filtros para tipos de archivos permitidos
const fileFilter = (req, file, cb) => {
  // Permitir solo imágenes JPEG y PNG
  if (file.fieldname === 'profilePicture' && (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png')) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no soportado'), false);
  }
};

const upload = multer({ storage, fileFilter });

// Registro de Cliente
/**
 * @route   POST /api/clientes/register
 * @desc    Registrar un nuevo cliente
 * @access  Público
 */
router.post(
  '/register',
  upload.single('profilePicture'), // Subida de foto de perfil
  [
    check('name', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'Por favor, incluye un email válido').isEmail(),
    check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
    // Otros checks según sea necesario
  ],
  validarCampos,
  registrarCliente
);

// Login de Cliente
/**
 * @route   POST /api/clientes/login
 * @desc    Iniciar sesión como cliente
 * @access  Público
 */
router.post(
  '/login',
  [
    check('email', 'Por favor, incluye un email válido').isEmail(),
    check('password', 'La contraseña es obligatoria').exists(),
  ],
  validarCampos,
  loginCliente
);

// Obtener Perfil del Cliente
/**
 * @route   GET /api/clientes/profile
 * @desc    Obtener el perfil del cliente autenticado
 * @access  Privado
 */
router.get('/profile', authMiddleware, obtenerPerfilCliente);

// Actualizar Perfil del Cliente
/**
 * @route   PUT /api/clientes/profile
 * @desc    Actualizar el perfil del cliente autenticado
 * @access  Privado
 */
router.put(
  '/profile',
  authMiddleware,
  upload.single('profilePicture'), // Subida de nueva foto de perfil (opcional)
  [
    check('email', 'Por favor, incluye un email válido').optional().isEmail(),
    check('password', 'La contraseña debe tener al menos 6 caracteres').optional().isLength({ min: 6 }),
    // Otros checks según sea necesario
  ],
  validarCampos,
  actualizarPerfilCliente
);

export default router;
