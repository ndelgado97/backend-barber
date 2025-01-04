import express from 'express';
import {
  enviarMensaje,
  obtenerMensajes,
  obtenerConversaciones,
} from './mensajeria.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import { check, param } from 'express-validator';
import validarCampos from '../../middlewares/validarCampos.js';

const router = express.Router();

/**
 * @route   POST /api/mensajeria
 * @desc    Enviar un nuevo mensaje
 * @access  Privado (Barberos y Clientes)
 */
router.post(
  '/',
  [
    authMiddleware,
    check('recipientId', 'ID del destinatario es obligatorio').isMongoId(),
    check('recipientRole', 'Rol del destinatario es obligatorio').isIn(['Barbero', 'Cliente']),
    check('content', 'El contenido del mensaje es obligatorio').not().isEmpty(),
    check('content', 'El contenido no puede exceder 1000 caracteres').isLength({ max: 1000 }),
    validarCampos,
  ],
  enviarMensaje
);

/**
 * @route   GET /api/mensajeria/mensajes/:userId/:userRole
 * @desc    Obtener mensajes entre el usuario autenticado y otro usuario
 * @access  Privado (Barberos y Clientes)
 */
router.get(
  '/mensajes/:userId/:userRole',
  [
    authMiddleware,
    param('userId', 'ID del usuario es obligatorio').isMongoId(),
    param('userRole', 'Rol del usuario es obligatorio').isIn(['Barbero', 'Cliente']),
    validarCampos,
  ],
  obtenerMensajes
);

/**
 * @route   GET /api/mensajeria/conversaciones
 * @desc    Obtener todas las conversaciones del usuario autenticado
 * @access  Privado (Barberos y Clientes)
 */
router.get(
  '/conversaciones',
  authMiddleware,
  obtenerConversaciones
);

export default router;
