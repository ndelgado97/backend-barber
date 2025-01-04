import express from 'express';
import {
  crearServicio,
  obtenerServiciosBarbero,
  obtenerServicio,
  actualizarServicio,
  eliminarServicio,
} from './servicios.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import { check } from 'express-validator';
import validarCampos from '../../middlewares/validarCampos.js';

const router = express.Router();

/**
 * @route   POST /api/servicios
 * @desc    Crear un nuevo servicio
 * @access  Privado (Solo Barberos)
 */
router.post(
  '/',
  [
    authMiddleware,
    check('nombre', 'El nombre del servicio es obligatorio').not().isEmpty(),
    check('descripcion', 'La descripción del servicio es obligatoria').not().isEmpty(),
    check('precio', 'El precio del servicio es obligatorio y debe ser un número').isFloat({ min: 0 }),
    check('duracion', 'La duración del servicio es obligatoria y debe ser un número').isInt({ min: 1 }),
    validarCampos,
  ],
  crearServicio
);

/**
 * @route   GET /api/servicios
 * @desc    Obtener todos los servicios del barbero autenticado
 * @access  Privado (Solo Barberos)
 */
router.get(
  '/',
  authMiddleware,
  obtenerServiciosBarbero
);

/**
 * @route   GET /api/servicios/:id
 * @desc    Obtener un servicio específico
 * @access  Privado (Solo Barberos)
 */
router.get(
  '/:id',
  authMiddleware,
  obtenerServicio
);

/**
 * @route   PUT /api/servicios/:id
 * @desc    Actualizar un servicio existente
 * @access  Privado (Solo Barberos)
 */
router.put(
  '/:id',
  [
    authMiddleware,
    check('precio', 'El precio debe ser un número').optional().isFloat({ min: 0 }),
    check('duracion', 'La duración debe ser un número').optional().isInt({ min: 1 }),
    validarCampos,
  ],
  actualizarServicio
);

/**
 * @route   DELETE /api/servicios/:id
 * @desc    Eliminar un servicio
 * @access  Privado (Solo Barberos)
 */
router.delete(
  '/:id',
  authMiddleware,
  eliminarServicio
);

export default router;
