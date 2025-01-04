import express from 'express';
import {
  crearSuscripcion,
  obtenerSuscripciones,
  obtenerSuscripcionPorId,
  actualizarSuscripcion,
  eliminarSuscripcion,
  suscribirseASuscripcion,
  manejarWebhookMercadoPago,
} from './suscripcion.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import { check } from 'express-validator';
import validarCampos from '../../middlewares/validarCampos.js';

const router = express.Router();

/**
 * @route   POST /api/suscripciones
 * @desc    Crear una nueva suscripción (Solo Admin)
 * @access  Privado (Solo Admin)
 */
router.post(
  '/',
  [
    authMiddleware,
    // Verificar que el usuario es Admin
    check('nombre', 'El nombre es obligatorio y no puede estar vacío').not().isEmpty(),
    check('precio', 'El precio es obligatorio y debe ser un número').isFloat({ gt: 0 }),
    check('duracion', 'La duración es obligatoria y debe ser un número de meses').isInt({ gt: 0 }),
    check('descripcion', 'La descripción no puede exceder 500 caracteres').optional().isLength({ max: 500 }),
    check('beneficios', 'Beneficios debe ser un arreglo').optional().isArray(),
    check('beneficios.*', 'Cada beneficio no puede exceder 200 caracteres').optional().isLength({ max: 200 }),
    validarCampos,
  ],
  crearSuscripcion
);

/**
 * @route   GET /api/suscripciones
 * @desc    Obtener todas las suscripciones (Público)
 * @access  Público
 */
router.get('/', obtenerSuscripciones);

/**
 * @route   GET /api/suscripciones/:id
 * @desc    Obtener una suscripción por ID (Público)
 * @access  Público
 */
router.get('/:id', obtenerSuscripcionPorId);

/**
 * @route   PUT /api/suscripciones/:id
 * @desc    Actualizar una suscripción existente (Solo Admin)
 * @access  Privado (Solo Admin)
 */
router.put(
  '/:id',
  [
    authMiddleware,
    // Verificar que el usuario es Admin
    check('nombre', 'El nombre no puede estar vacío').optional().not().isEmpty(),
    check('precio', 'El precio debe ser un número').optional().isFloat({ gt: 0 }),
    check('duracion', 'La duración debe ser un número de meses').optional().isInt({ gt: 0 }),
    check('descripcion', 'La descripción no puede exceder 500 caracteres').optional().isLength({ max: 500 }),
    check('beneficios', 'Beneficios debe ser un arreglo').optional().isArray(),
    check('beneficios.*', 'Cada beneficio no puede exceder 200 caracteres').optional().isLength({ max: 200 }),
    validarCampos,
  ],
  actualizarSuscripcion
);

/**
 * @route   DELETE /api/suscripciones/:id
 * @desc    Eliminar una suscripción (Solo Admin)
 * @access  Privado (Solo Admin)
 */
router.delete(
  '/:id',
  [
    authMiddleware,
    // Verificar que el usuario es Admin
    validarCampos,
  ],
  eliminarSuscripcion
);

/**
 * @route   POST /api/suscripciones/suscribirse
 * @desc    Suscribirse a una suscripción (Solo Barberos)
 * @access  Privado (Solo Barberos)
 */
router.post(
  '/suscribirse',
  [
    authMiddleware,
    check('suscripcionId', 'ID de suscripción es obligatorio y debe ser válido').isMongoId(),
    validarCampos,
  ],
  suscribirseASuscripcion
);

/**
 * @route   POST /api/suscripciones/mercadopago/webhook
 * @desc    Webhook para recibir notificaciones de Mercado Pago
 * @access  Público
 */
router.post(
  '/mercadopago/webhook',
  manejarWebhookMercadoPago
);

export default router;
