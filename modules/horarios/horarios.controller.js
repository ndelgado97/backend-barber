import Horario from './horarios.model.js';
import { validationResult } from 'express-validator';

// Crear un nuevo horario
export const crearHorario = async (req, res) => {
  // Validar datos de entrada
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  const { diaSemana, horaInicio, horaFin } = req.body;
  const barberoId = req.user._id; // Asumiendo que el middleware de autenticación añade el usuario a req.user

  try {
    // Verificar que no haya horarios superpuestos
    const horariosExistentes = await Horario.find({
      barbero: barberoId,
      diaSemana,
      $or: [
        {
          horaInicio: { $lt: horaFin },
          horaFin: { $gt: horaInicio },
        },
      ],
    });

    if (horariosExistentes.length > 0) {
      return res.status(400).json({ msg: 'Este horario se solapa con un horario existente' });
    }

    // Crear el nuevo horario
    const nuevoHorario = new Horario({
      barbero: barberoId,
      diaSemana,
      horaInicio,
      horaFin,
    });

    await nuevoHorario.save();

    res.status(201).json({ msg: 'Horario creado exitosamente', horario: nuevoHorario });
  } catch (error) {
    console.error('Error al crear el horario:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Obtener todos los horarios del barbero autenticado
export const obtenerHorarios = async (req, res) => {
  const barberoId = req.user._id;

  try {
    const horarios = await Horario.find({ barbero: barberoId }).sort({ diaSemana: 1, horaInicio: 1 });
    res.json(horarios);
  } catch (error) {
    console.error('Error al obtener los horarios:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Actualizar un horario existente
export const actualizarHorario = async (req, res) => {
  const { id } = req.params;
  const { diaSemana, horaInicio, horaFin } = req.body;
  const barberoId = req.user._id;

  // Validar datos de entrada
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  try {
    const horario = await Horario.findById(id);

    if (!horario) {
      return res.status(404).json({ msg: 'Horario no encontrado' });
    }

    // Verificar que el horario pertenece al barbero autenticado
    if (horario.barbero.toString() !== barberoId.toString()) {
      return res.status(403).json({ msg: 'No tienes permiso para actualizar este horario' });
    }

    // Actualizar los campos si se proporcionan
    if (diaSemana !== undefined) horario.diaSemana = diaSemana;
    if (horaInicio !== undefined) horario.horaInicio = horaInicio;
    if (horaFin !== undefined) horario.horaFin = horaFin;

    // Verificar que no haya horarios superpuestos
    const horariosExistentes = await Horario.find({
      barbero: barberoId,
      diaSemana: horario.diaSemana,
      _id: { $ne: id },
      $or: [
        {
          horaInicio: { $lt: horario.horaFin },
          horaFin: { $gt: horario.horaInicio },
        },
      ],
    });

    if (horariosExistentes.length > 0) {
      return res.status(400).json({ msg: 'Este horario se solapa con un horario existente' });
    }

    await horario.save();

    res.json({ msg: 'Horario actualizado exitosamente', horario });
  } catch (error) {
    console.error('Error al actualizar el horario:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Eliminar un horario existente
export const eliminarHorario = async (req, res) => {
  const { id } = req.params;
  const barberoId = req.user._id;

  try {
    const horario = await Horario.findById(id);

    if (!horario) {
      return res.status(404).json({ msg: 'Horario no encontrado' });
    }

    // Verificar que el horario pertenece al barbero autenticado
    if (horario.barbero.toString() !== barberoId.toString()) {
      return res.status(403).json({ msg: 'No tienes permiso para eliminar este horario' });
    }

    // Verificar que no haya citas programadas en este horario
    // Convertir diaSemana y horaInicio/horaFin a fecha actual para comparación
    const hoy = new Date();
    const diaActual = hoy.getDay(); // 0: Domingo, 1: Lunes, ..., 6: Sábado

    if (diaActual === horario.diaSemana) {
      const horaInicioTotal = parseInt(horario.horaInicio.split(':')[0]) * 60 + parseInt(horario.horaInicio.split(':')[1]);
      const horaFinTotal = parseInt(horario.horaFin.split(':')[0]) * 60 + parseInt(horario.horaFin.split(':')[1]);
      const horaActualTotal = hoy.getHours() * 60 + hoy.getMinutes();

      if (horaActualTotal >= horaInicioTotal && horaActualTotal < horaFinTotal) {
        return res.status(400).json({ msg: 'No puedes eliminar un horario en el que actualmente tienes una cita activa' });
      }
    }

    await horario.remove();

    res.json({ msg: 'Horario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el horario:', error.message);
    res.status(500).send('Error del servidor');
  }
};
