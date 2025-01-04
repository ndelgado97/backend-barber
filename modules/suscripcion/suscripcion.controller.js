import Suscripcion from './suscripcion.model.js';
import Barbero from '../barberos/barberos.model.js';
import { validationResult } from 'express-validator';
import mercadopago from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config();

// Configurar Mercado Pago

// Función para generar una preferencia de pago
const generarPreferenciaPago = async (suscripcion, barbero) => {
  const preference = {
    items: [
      {
        title: suscripcion.nombre,
        unit_price: suscripcion.precio,
        quantity: 1,
      },
    ],
    payer: {
      email: barbero.email,
      name: barbero.name,
    },
    back_urls: {
      success: `${process.env.APP_URL}/api/suscripciones/mercadopago/success`,
      failure: `${process.env.APP_URL}/api/suscripciones/mercadopago/failure`,
      pending: `${process.env.APP_URL}/api/suscripciones/mercadopago/pending`,
    },
    auto_return: 'approved',
  };

  try {
    const response = await mercadopago.preferences.create(preference);
    return response.body;
  } catch (error) {
    console.error('Error al crear preferencia de Mercado Pago:', error);
    throw new Error('Error al procesar el pago');
  }
};

// Crear una nueva suscripción (Solo Admin)
export const crearSuscripcion = async (req, res) => {
  // Validar los datos de entrada
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  const { nombre, precio, duracion, descripcion, beneficios } = req.body;

  try {
    // Verificar si la suscripción ya existe
    let suscripcion = await Suscripcion.findOne({ nombre });
    if (suscripcion) {
      return res.status(400).json({ msg: 'Ya existe una suscripción con ese nombre' });
    }

    // Crear una nueva suscripción
    suscripcion = new Suscripcion({
      nombre,
      precio,
      duracion,
      descripcion,
      beneficios,
    });

    await suscripcion.save();

    res.status(201).json({ msg: 'Suscripción creada exitosamente', suscripcion });
  } catch (error) {
    console.error('Error al crear la suscripción:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Obtener todas las suscripciones (Público)
export const obtenerSuscripciones = async (req, res) => {
  try {
    const suscripciones = await Suscripcion.find().sort({ precio: 1 });
    res.json(suscripciones);
  } catch (error) {
    console.error('Error al obtener las suscripciones:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Obtener una suscripción por ID (Público)
export const obtenerSuscripcionPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const suscripcion = await Suscripcion.findById(id);
    if (!suscripcion) {
      return res.status(404).json({ msg: 'Suscripción no encontrada' });
    }
    res.json(suscripcion);
  } catch (error) {
    console.error('Error al obtener la suscripción:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Suscripción no encontrada' });
    }
    res.status(500).send('Error del servidor');
  }
};

// Actualizar una suscripción (Solo Admin)
export const actualizarSuscripcion = async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, duracion, descripcion, beneficios } = req.body;

  // Validar los datos de entrada
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  try {
    let suscripcion = await Suscripcion.findById(id);
    if (!suscripcion) {
      return res.status(404).json({ msg: 'Suscripción no encontrada' });
    }

    // Actualizar campos
    suscripcion.nombre = nombre || suscripcion.nombre;
    suscripcion.precio = precio !== undefined ? precio : suscripcion.precio;
    suscripcion.duracion = duracion !== undefined ? duracion : suscripcion.duracion;
    suscripcion.descripcion = descripcion || suscripcion.descripcion;
    suscripcion.beneficios = beneficios || suscripcion.beneficios;
    suscripcion.actualizadoEn = Date.now();

    await suscripcion.save();

    res.json({ msg: 'Suscripción actualizada exitosamente', suscripcion });
  } catch (error) {
    console.error('Error al actualizar la suscripción:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Suscripción no encontrada' });
    }
    res.status(500).send('Error del servidor');
  }
};

// Eliminar una suscripción (Solo Admin)
export const eliminarSuscripcion = async (req, res) => {
  const { id } = req.params;

  try {
    const suscripcion = await Suscripcion.findById(id);
    if (!suscripcion) {
      return res.status(404).json({ msg: 'Suscripción no encontrada' });
    }

    // Verificar si hay barberos suscritos a esta suscripción
    const barberos = await Barbero.find({ suscripcion: id });
    if (barberos.length > 0) {
      return res.status(400).json({ msg: 'No se puede eliminar la suscripción porque hay barberos suscritos a ella' });
    }

    await suscripcion.remove();

    res.json({ msg: 'Suscripción eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar la suscripción:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Suscripción no encontrada' });
    }
    res.status(500).send('Error del servidor');
  }
};

// Suscribirse a un plan de suscripción (Solo Barberos)
export const suscribirseASuscripcion = async (req, res) => {
  // Validar los datos de entrada
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  const { suscripcionId } = req.body;
  const barberoId = req.user._id;

  try {
    const suscripcion = await Suscripcion.findById(suscripcionId);
    if (!suscripcion) {
      return res.status(404).json({ msg: 'Suscripción no encontrada' });
    }

    const barbero = await Barbero.findById(barberoId);
    if (!barbero) {
      return res.status(404).json({ msg: 'Barbero no encontrado' });
    }

    // Generar preferencia de pago con Mercado Pago
    const preferencia = await generarPreferenciaPago(suscripcion, barbero);

    // Guardar la preferencia en la base de datos si es necesario
    // Por ejemplo, para rastrear el estado del pago

    res.json({
      msg: 'Suscripción iniciada exitosamente',
      preferenciaMercadoPago: preferencia,
    });
  } catch (error) {
    console.error('Error al suscribirse a la suscripción:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Webhook para recibir notificaciones de Mercado Pago sobre el estado del pago
export const manejarWebhookMercadoPago = async (req, res) => {
  const data = req.query;
  const paymentId = data.payment_id;

  try {
    const payment = await mercadopago.payment.findById(paymentId);

    if (payment.body.status === 'approved') {
      // Actualizar la suscripción del barbero
      const suscripcionId = payment.body.additional_info.items[0].id; // Asumiendo que el id de la suscripción se incluye en los items
      const barberoId = payment.body.additional_info.payer.id; // Asumiendo que el id del barbero se incluye en el payer

      const barbero = await Barbero.findById(barberoId);
      if (barbero) {
        barbero.suscripcion = suscripcionId;
        barbero.fechaSuscripcion = new Date();
        await barbero.save();
      }
    }

    res.status(200).send('Webhook recibido');
  } catch (error) {
    console.error('Error al manejar el webhook de Mercado Pago:', error.message);
    res.status(500).send('Error del servidor');
  }
};
