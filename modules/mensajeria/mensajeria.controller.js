import Mensaje from './mensajeria.model.js';
import { validationResult } from 'express-validator';

// Enviar un nuevo mensaje
export const enviarMensaje = async (req, res) => {
  // Validar los datos de entrada
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  const { recipientId, recipientRole, content } = req.body;
  const senderId = req.user._id;
  const senderRole = req.user.role === 'barber' ? 'Barbero' : 'Cliente';

  try {
    // Validar el rol del destinatario
    if (!['Barbero', 'Cliente'].includes(recipientRole)) {
      return res.status(400).json({ msg: 'Rol de destinatario inválido' });
    }

    // Crear el mensaje
    const nuevoMensaje = new Mensaje({
      sender: senderId,
      senderModel: senderRole,
      recipient: recipientId,
      recipientModel: recipientRole,
      content,
    });

    await nuevoMensaje.save();

    res.status(201).json({ msg: 'Mensaje enviado exitosamente', mensaje: nuevoMensaje });
  } catch (error) {
    console.error('Error al enviar el mensaje:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Obtener mensajes entre el usuario autenticado y otro usuario
export const obtenerMensajes = async (req, res) => {
  const { userId, userRole } = req.params;
  const currentUserId = req.user._id;
  const currentUserRole = req.user.role === 'barber' ? 'Barbero' : 'Cliente';

  try {
    // Validar el rol del otro usuario
    if (!['Barbero', 'Cliente'].includes(userRole)) {
      return res.status(400).json({ msg: 'Rol de usuario inválido' });
    }

    // Obtener los mensajes entre los dos usuarios
    const mensajes = await Mensaje.find({
      $or: [
        { sender: currentUserId, senderModel: currentUserRole, recipient: userId, recipientModel: userRole },
        { sender: userId, senderModel: userRole, recipient: currentUserId, recipientModel: currentUserRole },
      ],
    })
      .sort({ createdAt: 1 }) // Ordenar por fecha de creación ascendente
      .populate('sender', 'name email profilePicture')
      .populate('recipient', 'name email profilePicture');

    res.json(mensajes);
  } catch (error) {
    console.error('Error al obtener los mensajes:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Obtener todas las conversaciones del usuario autenticado
export const obtenerConversaciones = async (req, res) => {
  const currentUserId = req.user._id;
  const currentUserRole = req.user.role === 'barber' ? 'Barbero' : 'Cliente';

  try {
    // Obtener los IDs únicos de los usuarios con los que el usuario actual ha intercambiado mensajes
    const mensajes = await Mensaje.find({
      $or: [
        { sender: currentUserId, senderModel: currentUserRole },
        { recipient: currentUserId, recipientModel: currentUserRole },
      ],
    })
      .sort({ createdAt: -1 }) // Ordenar por fecha de creación descendente
      .populate('sender', 'name email profilePicture')
      .populate('recipient', 'name email profilePicture');

    const conversacionesMap = {};

    mensajes.forEach((mensaje) => {
      let otroUsuario;
      if (mensaje.sender._id.toString() === currentUserId.toString()) {
        otroUsuario = mensaje.recipient;
      } else {
        otroUsuario = mensaje.sender;
      }

      const key = otroUsuario._id.toString();

      if (!conversacionesMap[key]) {
        conversacionesMap[key] = {
          usuario: otroUsuario,
          ultimoMensaje: mensaje,
        };
      }
    });

    const conversaciones = Object.values(conversacionesMap);

    res.json(conversaciones);
  } catch (error) {
    console.error('Error al obtener las conversaciones:', error.message);
    res.status(500).send('Error del servidor');
  }
};
