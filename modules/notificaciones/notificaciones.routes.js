import express from 'express';
import {
  crearNotificacion,
  obtenerNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
} from './notificaciones.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import { check } from 'express-validator';
import validarCampos from '../../middlewares/validarCampos.js';

const router = express.Router();

/**
 * @route   POST /api/notificaciones
 * @desc    Crear una nueva notificación
 * @access  Privado (Solo roles autorizados, como Barberos o Administradores)
 */
router.post(
  '/',
  [
    authMiddleware,
    check('usuario', 'ID del usuario destinatario es obligatorio').isMongoId(),
    check('tipoUsuario', 'Tipo de usuario es obligatorio y debe ser Barbero o Cliente').isIn(['Barbero', 'Cliente']),
    check('tipo', 'Tipo de notificación es obligatorio').not().isEmpty(),
    check('mensaje', 'El mensaje es obligatorio').not().isEmpty(),
    // Puedes agregar más validaciones según tus necesidades
    validarCampos,
  ],
  crearNotificacion
);

/**
 * @route   GET /api/notificaciones
 * @desc    Obtener todas las notificaciones para el usuario autenticado
 * @access  Privado
 */
router.get(
  '/',
  authMiddleware,
  obtenerNotificaciones
);

/**
 * @route   PUT /api/notificaciones/:id/leido
 * @desc    Marcar una notificación como leída
 * @access  Privado
 */
router.put(
  '/:id/leido',
  [
    authMiddleware,
    check('id', 'ID de notificación inválido').isMongoId(),
    validarCampos,
  ],
  marcarNotificacionLeida
);

/**
 * @route   PUT /api/notificaciones/leidas
 * @desc    Marcar todas las notificaciones como leídas
 * @access  Privado
 */
router.put(
  '/leidas',
  [
    authMiddleware,
    validarCampos,
  ],
  marcarTodasNotificacionesLeidas
);

export default router;
