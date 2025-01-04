import express from 'express';
import {
  crearPago,
  manejarWebhook,
  obtenerPagos,
  obtenerPagoPorId,
} from './pagos.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import { check } from 'express-validator';
import validarCampos from '../../middlewares/validarCampos.js';

const router = express.Router();

/**
 * @route   POST /api/pagos
 * @desc    Crear un nuevo pago (Barbero)
 * @access  Privado (Solo Barberos)
 */
router.post(
  '/',
  [
    authMiddleware,
    check('monto', 'El monto es obligatorio y debe ser un número').isFloat({ min: 1 }),
    validarCampos,
  ],
  crearPago
);

/**
 * @route   GET /api/pagos
 * @desc    Obtener todos los pagos del barbero autenticado
 * @access  Privado (Solo Barberos)
 */
router.get('/', authMiddleware, obtenerPagos);

/**
 * @route   GET /api/pagos/:id
 * @desc    Obtener un pago específico por ID
 * @access  Privado (Solo Barberos)
 */
router.get('/:id', authMiddleware, obtenerPagoPorId);

/**
 * @route   POST /api/pagos/webhook
 * @desc    Manejar notificaciones de Mercado Pago
 * @access  Público
 * 
 * Nota: Esta ruta debe estar disponible públicamente para que Mercado Pago pueda enviar webhooks.
 * Puedes protegerla con una clave secreta o limitar el acceso según tu configuración de Mercado Pago.
 */
router.post('/webhook', manejarWebhook);

export default router;
