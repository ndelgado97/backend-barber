import HorarioBloqueado from './horarioBloqueado.model.js';
import Cita from '../citas/citas.model.js';
import { validationResult } from 'express-validator';

// Crear un nuevo bloqueo de horario
export const crearHorarioBloqueado = async (req, res) => {
  // Validar los datos de entrada
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  const { tipo, fechaInicio, fechaFin, descripcion } = req.body;
  const barberoId = req.user._id; // Asumiendo que el middleware de autenticación añade el usuario a req.user

  try {
    // Verificar que no haya bloqueos superpuestos
    const bloqueosSuperpuestos = await HorarioBloqueado.findOne({
      barbero: barberoId,
      $or: [
        {
          fechaInicio: { $lt: new Date(fechaFin) },
          fechaFin: { $gt: new Date(fechaInicio) },
        },
      ],
    });

    if (bloqueosSuperpuestos) {
      return res.status(400).json({ msg: 'Ya tienes un bloqueo en este rango de fechas y horas' });
    }

    // Verificar que no haya citas en el rango de bloqueo
    const citasSuperpuestas = await Cita.findOne({
      barbero: barberoId,
      fecha: { $gte: new Date(fechaInicio), $lt: new Date(fechaFin) },
      estado: { $ne: 'Cancelada' },
    });

    if (citasSuperpuestas) {
      return res.status(400).json({ msg: 'No puedes bloquear este horario porque tienes citas programadas' });
    }

    // Crear el bloqueo de horario
    const nuevoBloqueo = new HorarioBloqueado({
      barbero: barberoId,
      tipo,
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
      descripcion,
    });

    await nuevoBloqueo.save();

    res.status(201).json({ msg: 'Horario bloqueado exitosamente', bloqueo: nuevoBloqueo });
  } catch (error) {
    console.error('Error al crear el bloqueo de horario:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Obtener todos los bloqueos de horario para el barbero autenticado
export const obtenerHorariosBloqueados = async (req, res) => {
  const barberoId = req.user._id;

  try {
    const bloqueos = await HorarioBloqueado.find({ barbero: barberoId }).sort({ fechaInicio: 1 });

    res.json(bloqueos);
  } catch (error) {
    console.error('Error al obtener los bloqueos de horario:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Actualizar un bloqueo de horario
export const actualizarHorarioBloqueado = async (req, res) => {
  const { id } = req.params; // ID del bloqueo
  const { tipo, fechaInicio, fechaFin, descripcion } = req.body;
  const barberoId = req.user._id;

  // Validar los datos de entrada
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  try {
    const bloqueo = await HorarioBloqueado.findById(id);

    if (!bloqueo) {
      return res.status(404).json({ msg: 'Bloqueo de horario no encontrado' });
    }

    // Verificar que el bloqueo pertenece al barbero autenticado
    if (bloqueo.barbero.toString() !== barberoId.toString()) {
      return res.status(403).json({ msg: 'No tienes permiso para actualizar este bloqueo' });
    }

    // Verificar que no haya bloqueos superpuestos (excluyendo el bloqueo actual)
    const bloqueosSuperpuestos = await HorarioBloqueado.findOne({
      barbero: barberoId,
      _id: { $ne: id },
      $or: [
        {
          fechaInicio: { $lt: new Date(fechaFin) },
          fechaFin: { $gt: new Date(fechaInicio) },
        },
      ],
    });

    if (bloqueosSuperpuestos) {
      return res.status(400).json({ msg: 'Ya tienes un bloqueo en este rango de fechas y horas' });
    }

    // Verificar que no haya citas en el nuevo rango de bloqueo
    const citasSuperpuestas = await Cita.findOne({
      barbero: barberoId,
      fecha: { $gte: new Date(fechaInicio), $lt: new Date(fechaFin) },
      estado: { $ne: 'Cancelada' },
    });

    if (citasSuperpuestas) {
      return res.status(400).json({ msg: 'No puedes bloquear este horario porque tienes citas programadas' });
    }

    // Actualizar el bloqueo
    bloqueo.tipo = tipo || bloqueo.tipo;
    bloqueo.fechaInicio = fechaInicio ? new Date(fechaInicio) : bloqueo.fechaInicio;
    bloqueo.fechaFin = fechaFin ? new Date(fechaFin) : bloqueo.fechaFin;
    bloqueo.descripcion = descripcion !== undefined ? descripcion : bloqueo.descripcion;
    bloqueo.actualizadoEn = Date.now();

    await bloqueo.save();

    res.json({ msg: 'Bloqueo de horario actualizado exitosamente', bloqueo });
  } catch (error) {
    console.error('Error al actualizar el bloqueo de horario:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Eliminar un bloqueo de horario
export const eliminarHorarioBloqueado = async (req, res) => {
  const { id } = req.params; // ID del bloqueo
  const barberoId = req.user._id;

  try {
    const bloqueo = await HorarioBloqueado.findById(id);

    if (!bloqueo) {
      return res.status(404).json({ msg: 'Bloqueo de horario no encontrado' });
    }

    // Verificar que el bloqueo pertenece al barbero autenticado
    if (bloqueo.barbero.toString() !== barberoId.toString()) {
      return res.status(403).json({ msg: 'No tienes permiso para eliminar este bloqueo' });
    }

    // Verificar que no haya citas en el rango de bloqueo
    const citasSuperpuestas = await Cita.findOne({
      barbero: barberoId,
      fecha: { $gte: bloqueo.fechaInicio, $lt: bloqueo.fechaFin },
      estado: { $ne: 'Cancelada' },
    });

    if (citasSuperpuestas) {
      return res.status(400).json({ msg: 'No puedes eliminar este bloqueo porque tienes citas programadas en este rango de fechas y horas' });
    }

    await bloqueo.remove();

    res.json({ msg: 'Bloqueo de horario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el bloqueo de horario:', error.message);
    res.status(500).send('Error del servidor');
  }
};
