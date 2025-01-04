
import Cita from './citas.model.js';
import Barbero from '../barberos/barberos.model.js';
import Cliente from '../clientes/clientes.model.js';
import Servicio from '../servicios/servicios.model.js';
import { validationResult } from 'express-validator';

// Crear una nueva cita
export const crearCita = async (req, res) => {
  // Validar los datos de entrada
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  const { barbero, servicios, fecha, metodoPago, comentarios } = req.body;
  const cliente = req.user._id; // Asumiendo que el middleware de autenticación añade el usuario a req.user

  try {
    // Verificar que el barbero exista
    const barberoExistente = await Barbero.findById(barbero);
    if (!barberoExistente) {
      return res.status(404).json({ msg: 'Barbero no encontrado' });
    }

    // Verificar que los servicios existan
    if (servicios && servicios.length > 0) {
      const serviciosExistentes = await Servicio.find({ _id: { $in: servicios } });
      if (serviciosExistentes.length !== servicios.length) {
        return res.status(400).json({ msg: 'Algunos servicios no son válidos' });
      }
    }

    // Verificar disponibilidad del barbero en la fecha y hora
    const citaExistente = await Cita.findOne({
      barbero,
      fecha: new Date(fecha),
      estado: { $ne: 'Cancelada' },
    });

    if (citaExistente) {
      return res.status(400).json({ msg: 'El barbero no está disponible en esta fecha y hora' });
    }

    // Calcular el total de la cita sumando los precios de los servicios
    let total = 0;
    if (servicios && servicios.length > 0) {
      const serviciosData = await Servicio.find({ _id: { $in: servicios } });
      total = serviciosData.reduce((acc, servicio) => acc + servicio.precio, 0);
    }

    // Crear la cita
    const nuevaCita = new Cita({
      cliente,
      barbero,
      servicios,
      fecha: new Date(fecha),
      metodoPago,
      total,
      comentarios,
    });

    await nuevaCita.save();

    res.status(201).json({ msg: 'Cita creada exitosamente', cita: nuevaCita });
  } catch (error) {
    console.error('Error al crear la cita:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Obtener todas las citas para un barbero
export const obtenerCitasBarbero = async (req, res) => {
  const barberoId = req.user._id; // Asumiendo que el usuario autenticado es un barbero

  try {
    const citas = await Cita.find({ barbero: barberoId })
      .populate('cliente', 'name email')
      .populate('servicios', 'nombre precio')
      .sort({ fecha: 1 });

    res.json(citas);
  } catch (error) {
    console.error('Error al obtener las citas del barbero:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Obtener todas las citas para un cliente
export const obtenerCitasCliente = async (req, res) => {
  const clienteId = req.user._id; // Asumiendo que el usuario autenticado es un cliente

  try {
    const citas = await Cita.find({ cliente: clienteId })
      .populate('barbero', 'name email')
      .populate('servicios', 'nombre precio')
      .sort({ fecha: 1 });

    res.json(citas);
  } catch (error) {
    console.error('Error al obtener las citas del cliente:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Actualizar el estado de una cita (solo para barberos)
export const actualizarEstadoCita = async (req, res) => {
  const { id } = req.params; // ID de la cita
  const { estado } = req.body;

  // Validar los datos de entrada
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  const estadosPermitidos = ['Confirmada', 'Cancelada'];

  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({ msg: 'Estado de cita inválido' });
  }

  try {
    const cita = await Cita.findById(id).populate('cliente', 'name email');

    if (!cita) {
      return res.status(404).json({ msg: 'Cita no encontrada' });
    }

    // Verificar que el barbero que actualiza es el dueño de la cita
    if (cita.barbero.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'No tienes permiso para actualizar esta cita' });
    }

    cita.estado = estado;
    await cita.save();

    res.json({ msg: 'Estado de cita actualizado exitosamente', cita });
  } catch (error) {
    console.error('Error al actualizar el estado de la cita:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Cancelar una cita (por cliente o barbero)
export const cancelarCita = async (req, res) => {
  const { id } = req.params; // ID de la cita

  try {
    const cita = await Cita.findById(id);

    if (!cita) {
      return res.status(404).json({ msg: 'Cita no encontrada' });
    }

    // Verificar que quien cancela es el cliente o el barbero
    if (
      cita.cliente.toString() !== req.user._id.toString() &&
      cita.barbero.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ msg: 'No tienes permiso para cancelar esta cita' });
    }

    if (cita.estado === 'Cancelada') {
      return res.status(400).json({ msg: 'La cita ya está cancelada' });
    }

    cita.estado = 'Cancelada';
    await cita.save();

    res.json({ msg: 'Cita cancelada exitosamente', cita });
  } catch (error) {
    console.error('Error al cancelar la cita:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Reprogramar una cita
export const reprogramarCita = async (req, res) => {
  const { id } = req.params; // ID de la cita
  const { nuevaFecha } = req.body;

  // Validar los datos de entrada
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  try {
    const cita = await Cita.findById(id);

    if (!cita) {
      return res.status(404).json({ msg: 'Cita no encontrada' });
    }

    // Verificar que quien reprograma es el cliente o el barbero
    if (
      cita.cliente.toString() !== req.user._id.toString() &&
      cita.barbero.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ msg: 'No tienes permiso para reprogramar esta cita' });
    }

    // Verificar disponibilidad del barbero en la nueva fecha
    const citaExistente = await Cita.findOne({
      barbero: cita.barbero,
      fecha: new Date(nuevaFecha),
      estado: { $ne: 'Cancelada' },
    });

    if (citaExistente) {
      return res.status(400).json({ msg: 'El barbero no está disponible en la nueva fecha y hora' });
    }

    cita.fecha = new Date(nuevaFecha);
    cita.estado = 'Pendiente'; // Reprogramar cambia el estado a pendiente
    await cita.save();

    res.json({ msg: 'Cita reprogramada exitosamente', cita });
  } catch (error) {
    console.error('Error al reprogramar la cita:', error.message);
    res.status(500).send('Error del servidor');
  }
};
