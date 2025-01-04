// modules/pagos/pagos.controller.js

import Pago from './pagos.model.js';
import Barbero from '../barberos/barberos.model.js';
import mercadopago from 'mercadopago';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { sendErrorResponse, sendSuccessResponse } from '../../utils/helper.js';

dotenv.config();

// Configuración de Mercado Pago


/**
 * Crear un nuevo pago
 */
export const crearPago = async (req, res) => {
  const { monto } = req.body;
  const barberoId = req.user._id;

  try {
    // Verificar que el barbero exista
    const barbero = await Barbero.findById(barberoId);
    if (!barbero) {
      return sendErrorResponse(res, 404, null, 'Barbero no encontrado');
    }

    // Generar una referencia única
    const referencia = uuidv4();

    // Crear el objeto de pago en la base de datos
    const nuevoPago = new Pago({
      barbero: barberoId,
      monto,
      referencia,
      estado: 'Pendiente',
    });

    await nuevoPago.save();

    // Crear una preferencia de pago en Mercado Pago
    const preference = {
      items: [
        {
          title: 'Pago al Administrador del Sistema',
          unit_price: monto,
          quantity: 1,
          currency_id: 'CLP',
        },
      ],
      back_urls: {
        success: `${process.env.FRONTEND_URL}/pagos/exitoso`,
        failure: `${process.env.FRONTEND_URL}/pagos/fallido`,
        pending: `${process.env.FRONTEND_URL}/pagos/pendiente`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.BACKEND_URL}/api/pagos/webhook`,
      external_reference: referencia,
    };

    const respuesta = await mercadopago.preferences.create(preference);

    // Guardar la URL de pago en el modelo de pago
    nuevoPago.transactionDetails = {
      preferenceId: respuesta.body.id,
      init_point: respuesta.body.init_point,
      sandbox_init_point: respuesta.body.sandbox_init_point,
    };

    await nuevoPago.save();

    sendSuccessResponse(res, 201, {
      msg: 'Pago creado exitosamente',
      pago: {
        id: nuevoPago._id,
        monto: nuevoPago.monto,
        estado: nuevoPago.estado,
        referencia: nuevoPago.referencia,
        init_point: nuevoPago.transactionDetails.init_point,
      },
    }, 'Pago creado exitosamente');
  } catch (error) {
    console.error('Error al crear el pago:', error.message);
    sendErrorResponse(res, 500, error.message, 'Error del servidor');
  }
};

/**
 * Webhook de Mercado Pago para recibir notificaciones de pagos
 */
export const manejarWebhook = async (req, res) => {
  const topic = req.headers['x-mercadopago-topic'];
  const id = req.body.id;

  if (topic === 'payment') {
    try {
      // Obtener la información del pago
      const payment = await mercadopago.payment.get(id);
      const { external_reference, status } = payment.body;

      // Buscar el pago en la base de datos
      const pago = await Pago.findOne({ referencia: external_reference });

      if (!pago) {
        return sendErrorResponse(res, 404, null, 'Pago no encontrado');
      }

      // Actualizar el estado del pago según el status de Mercado Pago
      switch (status) {
        case 'approved':
          pago.estado = 'Aprobado';
          break;
        case 'pending':
          pago.estado = 'En Proceso';
          break;
        case 'rejected':
          pago.estado = 'Rechazado';
          break;
        default:
          pago.estado = 'Pendiente';
      }

      // Guardar los detalles de la transacción
      pago.transactionDetails = payment.body;

      await pago.save();

      res.status(200).send('Webhook recibido y procesado');
    } catch (error) {
      console.error('Error al manejar el webhook:', error.message);
      res.status(500).send('Error del servidor');
    }
  } else {
    res.status(400).send('Evento no manejado');
  }
};

/**
 * Obtener todos los pagos del barbero autenticado
 */
export const obtenerPagos = async (req, res) => {
  const barberoId = req.user._id;

  try {
    const pagos = await Pago.find({ barbero: barberoId })
      .sort({ creadoEn: -1 })
      .lean();

    sendSuccessResponse(res, 200, pagos, 'Pagos obtenidos exitosamente');
  } catch (error) {
    console.error('Error al obtener los pagos:', error.message);
    sendErrorResponse(res, 500, error.message, 'Error del servidor');
  }
};

/**
 * Obtener un pago específico por ID
 */
export const obtenerPagoPorId = async (req, res) => {
  const { id } = req.params;
  const barberoId = req.user._id;

  try {
    const pago = await Pago.findOne({ _id: id, barbero: barberoId });

    if (!pago) {
      return sendErrorResponse(res, 404, null, 'Pago no encontrado');
    }

    sendSuccessResponse(res, 200, pago, 'Pago obtenido exitosamente');
  } catch (error) {
    console.error('Error al obtener el pago:', error.message);
    sendErrorResponse(res, 500, error.message, 'Error del servidor');
  }
};
