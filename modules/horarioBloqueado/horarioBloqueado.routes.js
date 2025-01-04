import express from 'express';
import {
  crearHorarioBloqueado,
  obtenerHorariosBloqueados,
  actualizarHorarioBloqueado,
  eliminarHorarioBloqueado,
} from './horarioBloqueado.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import { check } from 'express-validator';
import validarCampos from '../../middlewares/validarCampos.js';

const router = express.Router();

/**
 * @route   POST /api/horariobloqueados
 * @desc    Crear un nuevo bloqueo de horario
 * @access  Privado (Solo Barberos)
 */
router.post(
  '/',
  [
    authMiddleware,
    check('tipo', 'Tipo es obligatorio y debe ser Comida, Descanso o Otro').isIn(['Comida', 'Descanso', 'Otro']),
    check('fechaInicio', 'Fecha de inicio es requerida y debe ser una fecha válida').isISO8601(),
    check('fechaFin', 'Fecha de fin es requerida y debe ser una fecha válida').isISO8601(),
    check('descripcion', 'La descripción no puede exceder 200 caracteres').optional().isLength({ max: 200 }),
    validarCampos,
  ],
  crearHorarioBloqueado
);

/**
 * @route   GET /api/horariobloqueados
 * @desc    Obtener todos los bloqueos de horario del barbero autenticado
 * @access  Privado (Solo Barberos)
 */
router.get(
  '/',
  authMiddleware,
  obtenerHorariosBloqueados
);

/**
 * @route   PUT /api/horariobloqueados/:id
 * @desc    Actualizar un bloqueo de horario existente
 * @access  Privado (Solo Barberos)
 */
router.put(
  '/:id',
  [
    authMiddleware,
    check('tipo', 'Tipo debe ser Comida, Descanso o Otro').optional().isIn(['Comida', 'Descanso', 'Otro']),
    check('fechaInicio', 'Fecha de inicio debe ser una fecha válida').optional().isISO8601(),
    check('fechaFin', 'Fecha de fin debe ser una fecha válida').optional().isISO8601(),
    check('descripcion', 'La descripción no puede exceder 200 caracteres').optional().isLength({ max: 200 }),
    validarCampos,
  ],
  actualizarHorarioBloqueado
);

/**
 * @route   DELETE /api/horariobloqueados/:id
 * @desc    Eliminar un bloqueo de horario
 * @access  Privado (Solo Barberos)
 */
router.delete(
  '/:id',
  authMiddleware,
  eliminarHorarioBloqueado
);

export default router;
