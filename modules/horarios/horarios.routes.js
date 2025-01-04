import express from 'express';
import {
  crearHorario,
  obtenerHorarios,
  actualizarHorario,
  eliminarHorario,
} from './horarios.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import { check } from 'express-validator';
import validarCampos from '../../middlewares/validarCampos.js';

const router = express.Router();

/**
 * @route   POST /api/horarios
 * @desc    Crear un nuevo horario
 * @access  Privado (Solo Barberos)
 */
router.post(
  '/',
  [
    authMiddleware,
    check('diaSemana', 'Dia de la semana es requerido y debe ser un número entre 0 y 6')
      .isInt({ min: 0, max: 6 }),
    check('horaInicio', 'Hora de inicio es requerida y debe tener el formato HH:MM')
      .matches(/^[0-2]\d:[0-5]\d$/),
    check('horaFin', 'Hora de fin es requerida y debe tener el formato HH:MM')
      .matches(/^[0-2]\d:[0-5]\d$/),
    check('motivo', 'El motivo no puede exceder 200 caracteres').optional().isLength({ max: 200 }),
    validarCampos,
  ],
  crearHorario
);

/**
 * @route   GET /api/horarios
 * @desc    Obtener todos los horarios del barbero autenticado
 * @access  Privado (Solo Barberos)
 */
router.get(
  '/',
  authMiddleware,
  obtenerHorarios
);

/**
 * @route   PUT /api/horarios/:id
 * @desc    Actualizar un horario existente
 * @access  Privado (Solo Barberos)
 */
router.put(
  '/:id',
  [
    authMiddleware,
    check('diaSemana', 'Dia de la semana debe ser un número entre 0 y 6')
      .optional()
      .isInt({ min: 0, max: 6 }),
    check('horaInicio', 'Hora de inicio debe tener el formato HH:MM')
      .optional()
      .matches(/^[0-2]\d:[0-5]\d$/),
    check('horaFin', 'Hora de fin debe tener el formato HH:MM')
      .optional()
      .matches(/^[0-2]\d:[0-5]\d$/),
    check('motivo', 'El motivo no puede exceder 200 caracteres').optional().isLength({ max: 200 }),
    validarCampos,
  ],
  actualizarHorario
);

/**
 * @route   DELETE /api/horarios/:id
 * @desc    Eliminar un horario existente
 * @access  Privado (Solo Barberos)
 */
router.delete(
  '/:id',
  authMiddleware,
  eliminarHorario
);

export default router;
