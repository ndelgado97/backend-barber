import express from 'express';
import {
  crearCita,
  obtenerCitasBarbero,
  obtenerCitasCliente,
  actualizarEstadoCita,
  cancelarCita,
  reprogramarCita,
} from './citas.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import { check } from 'express-validator';
import validarCampos from '../../middlewares/validarCampos.js';

const router = express.Router();

/**
 * @route   POST /api/citas
 * @desc    Crear una nueva cita
 * @access  Privado (Solo Clientes)
 */
router.post(
  '/',
  [
    authMiddleware,
    check('barbero', 'ID del barbero es requerido').isMongoId(),
    check('servicios', 'Servicios deben ser un arreglo de IDs válidos').isArray(),
    check('fecha', 'Fecha es requerida y debe ser una fecha válida').isISO8601(),
    check('metodoPago', 'Método de pago es requerido').isIn(['Transferencia', 'Efectivo', 'Tarjeta']),
    check('comentarios', 'Comentarios no pueden exceder 500 caracteres').optional().isLength({ max: 500 }),
    validarCampos,
  ],
  crearCita
);

/**
 * @route   GET /api/citas/barbero
 * @desc    Obtener todas las citas para el barbero autenticado
 * @access  Privado (Solo Barberos)
 */
router.get(
  '/barbero',
  authMiddleware,
  obtenerCitasBarbero
);

/**
 * @route   GET /api/citas/cliente
 * @desc    Obtener todas las citas para el cliente autenticado
 * @access  Privado (Solo Clientes)
 */
router.get(
  '/cliente',
  authMiddleware,
  obtenerCitasCliente
);

/**
 * @route   PUT /api/citas/:id/estado
 * @desc    Actualizar el estado de una cita (Confirmada, Cancelada)
 * @access  Privado (Solo Barberos)
 */
router.put(
  '/:id/estado',
  [
    authMiddleware,
    check('estado', 'Estado es requerido y debe ser Confirmada o Cancelada').isIn(['Confirmada', 'Cancelada']),
    validarCampos,
  ],
  actualizarEstadoCita
);

/**
 * @route   DELETE /api/citas/:id
 * @desc    Cancelar una cita
 * @access  Privado (Solo Clientes o Barberos asociados)
 */
router.delete(
  '/:id',
  authMiddleware,
  cancelarCita
);

/**
 * @route   PUT /api/citas/:id/reprogramar
 * @desc    Reprogramar una cita a una nueva fecha y hora
 * @access  Privado (Solo Clientes o Barberos asociados)
 */
router.put(
  '/:id/reprogramar',
  [
    authMiddleware,
    check('nuevaFecha', 'La nueva fecha es requerida y debe ser una fecha válida').isISO8601(),
    validarCampos,
  ],
  reprogramarCita
);

export default router;
