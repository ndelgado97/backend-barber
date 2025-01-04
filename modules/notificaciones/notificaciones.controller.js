import Notificacion from './notificaciones.model.js';
import { validationResult } from 'express-validator';

// Crear una nueva notificación
export const crearNotificacion = async (req, res) => {
  // Validar los datos de entrada
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  const { tipo, mensaje, datosAdicionales } = req.body;
  const usuarioId = req.body.usuario;
  const tipoUsuario = req.body.tipoUsuario; 

  try {
    // Crear la notificación
    const nuevaNotificacion = new Notificacion({
      usuario: usuarioId,
      tipoUsuario,
      tipo,
      mensaje,
      datosAdicionales,
    });

    await nuevaNotificacion.save();

    res.status(201).json({ msg: 'Notificación creada exitosamente', notificacion: nuevaNotificacion });
  } catch (error) {
    console.error('Error al crear la notificación:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Obtener todas las notificaciones para el usuario autenticado
export const obtenerNotificaciones = async (req, res) => {
  const usuarioId = req.user._id;
  const tipoUsuario = req.user.__t || req.user.role === 'barber' ? 'Barbero' : 'Cliente'; // Asegúrate de tener un campo que indique el tipo de usuario

  try {
    const notificaciones = await Notificacion.find({ usuario: usuarioId, tipoUsuario })
      .sort({ fecha: -1 })
      .limit(100); // Limita a las últimas 100 notificaciones

    res.json(notificaciones);
  } catch (error) {
    console.error('Error al obtener las notificaciones:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Marcar una notificación como leída
export const marcarNotificacionLeida = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.user._id;

  try {
    const notificacion = await Notificacion.findById(id);

    if (!notificacion) {
      return res.status(404).json({ msg: 'Notificación no encontrada' });
    }

    // Verificar que la notificación pertenece al usuario autenticado
    if (notificacion.usuario.toString() !== usuarioId.toString()) {
      return res.status(403).json({ msg: 'No tienes permiso para actualizar esta notificación' });
    }

    notificacion.leido = true;
    await notificacion.save();

    res.json({ msg: 'Notificación marcada como leída', notificacion });
  } catch (error) {
    console.error('Error al marcar la notificación como leída:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Marcar todas las notificaciones como leídas
export const marcarTodasNotificacionesLeidas = async (req, res) => {
  const usuarioId = req.user._id;
  const tipoUsuario = req.user.__t || req.user.role === 'barber' ? 'Barbero' : 'Cliente';

  try {
    const resultado = await Notificacion.updateMany(
      { usuario: usuarioId, tipoUsuario, leido: false },
      { $set: { leido: true } }
    );

    res.json({ msg: 'Todas las notificaciones marcadas como leídas', resultado });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error.message);
    res.status(500).send('Error del servidor');
  }
};
