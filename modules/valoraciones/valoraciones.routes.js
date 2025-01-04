import express from 'express';
import {
  crearValoracion,
  obtenerValoracionesBarbero,
  obtenerValoracionesCliente,
  eliminarValoracion,
} from './valoraciones.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import { check, param } from 'express-validator';
import validarCampos from '../../middlewares/validarCampos.js';

const router = express.Router();

/**
 * @route   POST /api/valoraciones
 * @desc    Crear una nueva valoración (Solo Clientes)
 * @access  Privado
 */
router.post(
  '/',
  [
    authMiddleware,
    check('barbero', 'ID del barbero es obligatorio y debe ser válido').isMongoId(),
    check('puntuacion', 'La puntuación es obligatoria y debe estar entre 1 y 5').isInt({ min: 1, max: 5 }),
    check('comentario', 'El comentario no puede exceder 500 caracteres').optional().isLength({ max: 500 }),
    validarCampos,
  ],
  crearValoracion
);

/**
 * @route   GET /api/valoraciones/barbero/:barberoId
 * @desc    Obtener todas las valoraciones de un barbero específico
 * @access  Público
 */
router.get(
  '/barbero/:barberoId',
  [
    param('barberoId', 'ID del barbero debe ser válido').isMongoId(),
    validarCampos,
  ],
  obtenerValoracionesBarbero
);

/**
 * @route   GET /api/valoraciones/cliente
 * @desc    Obtener todas las valoraciones realizadas por el cliente autenticado
 * @access  Privado
 */
router.get(
  '/cliente',
  authMiddleware,
  obtenerValoracionesCliente
);

/**
 * @route   DELETE /api/valoraciones/:id
 * @desc    Eliminar una valoración (Solo el cliente que la creó o Admin)
 * @access  Privado
 */
router.delete(
  '/:id',
  [
    authMiddleware,
    param('id', 'ID de la valoración debe ser válido').isMongoId(),
    validarCampos,
  ],
  eliminarValoracion
);

export default router;
