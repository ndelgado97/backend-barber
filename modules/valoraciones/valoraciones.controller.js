import Valoracion from './valoraciones.model.js';
import Cita from '../citas/citas.model.js';
import { validationResult } from 'express-validator';

// Crear una nueva valoración
export const crearValoracion = async (req, res) => {
  // Validar los datos de entrada
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  const { barbero, puntuacion, comentario } = req.body;
  const clienteId = req.user._id; // Asumiendo que el middleware de autenticación añade el usuario a req.user

  try {
    // Verificar que el barbero existe
    const barberoExistente = await Barbero.findById(barbero);
    if (!barberoExistente) {
      return res.status(404).json({ msg: 'Barbero no encontrado' });
    }

    // Verificar que el cliente ha tenido al menos una cita completada con el barbero
    const citaCompletada = await Cita.findOne({
      cliente: clienteId,
      barbero: barbero,
      estado: 'Confirmada', // Asumiendo que 'Confirmada' significa completada
    });

    if (!citaCompletada) {
      return res.status(400).json({ msg: 'Debes tener al menos una cita completada con este barbero para valorarlo' });
    }

    // Crear la valoración
    const nuevaValoracion = new Valoracion({
      cliente: clienteId,
      barbero,
      puntuacion,
      comentario,
    });

    await nuevaValoracion.save();

    res.status(201).json({ msg: 'Valoración creada exitosamente', valoracion: nuevaValoracion });
  } catch (error) {
    console.error('Error al crear la valoración:', error.message);
    if (error.code === 11000) {
      return res.status(400).json({ msg: 'Ya has valorado a este barbero' });
    }
    res.status(500).send('Error del servidor');
  }
};

// Obtener todas las valoraciones de un barbero
export const obtenerValoracionesBarbero = async (req, res) => {
  const { barberoId } = req.params;

  try {
    const valoraciones = await Valoracion.find({ barbero: barberoId })
      .populate('cliente', 'name email')
      .sort({ fecha: -1 });

    res.json(valoraciones);
  } catch (error) {
    console.error('Error al obtener las valoraciones:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Obtener valoraciones de un cliente
export const obtenerValoracionesCliente = async (req, res) => {
  const clienteId = req.user._id;

  try {
    const valoraciones = await Valoracion.find({ cliente: clienteId })
      .populate('barbero', 'name email')
      .sort({ fecha: -1 });

    res.json(valoraciones);
  } catch (error) {
    console.error('Error al obtener las valoraciones del cliente:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Eliminar una valoración (Solo el cliente que la creó o Admin)
export const eliminarValoracion = async (req, res) => {
  const { id } = req.params;
  const clienteId = req.user._id;
  const role = req.user.role; // Asumiendo que el middleware de autenticación añade el rol

  try {
    const valoracion = await Valoracion.findById(id);

    if (!valoracion) {
      return res.status(404).json({ msg: 'Valoración no encontrada' });
    }

    // Verificar permisos
    if (valoracion.cliente.toString() !== clienteId.toString() && role !== 'admin') {
      return res.status(403).json({ msg: 'No tienes permiso para eliminar esta valoración' });
    }

    await valoracion.remove();

    res.json({ msg: 'Valoración eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar la valoración:', error.message);
    res.status(500).send('Error del servidor');
  }
};
