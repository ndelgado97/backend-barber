import express from 'express';
import { banearUsuario, desbanearUsuario, obtenerBaneos } from './baneos.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import { check } from 'express-validator';
import validarCampos from '../../middlewares/validarCampos.js';

const router = express.Router();

/**
 * @route   POST /api/baneos
 * @desc    Banear un usuario (Barbero o Cliente)
 * @access  Privado (Solo Barberos)
 */
router.post(
  '/',
  [
    authMiddleware, // Middleware de autenticación
    check('usuarioBaneado', 'ID de usuario es requerido').isMongoId(),
    check('tipoUsuario', 'Tipo de usuario debe ser Barbero o Cliente').isIn(['Barbero', 'Cliente']),
    check('motivo', 'Motivo es requerido').not().isEmpty(),
    validarCampos, // Middleware para manejar errores de validación
  ],
  banearUsuario
);

/**
 * @route   PUT /api/baneos/:id/desbanear
 * @desc    Desbanear un usuario
 * @access  Privado (Solo Barberos)
 */
router.put(
  '/:id/desbanear',
  authMiddleware,
  desbanearUsuario
);

/**
 * @route   GET /api/baneos
 * @desc    Obtener todos los baneos (con filtros opcionales)
 * @access  Privado (Solo Barberos)
 */
router.get(
  '/',
  authMiddleware,
  obtenerBaneos
);

export default router;
