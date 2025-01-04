// middlewares/auth.middleware.js

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { sendErrorResponse } from '../utils/helper.js';

// Configurar variables de entorno
dotenv.config();

/**
 * Middleware para autenticar a los usuarios utilizando JWT.
 * Verifica la presencia y validez del token en el encabezado de autorización.
 * Si el token es válido, adjunta la información del usuario al objeto req.
 * Si el token es inválido o ausente, responde con un error de autenticación.
 */
const authMiddleware = (req, res, next) => {
  // Obtener el token del encabezado de autorización
  const authHeader = req.headers.authorization;

  // Verificar si el encabezado de autorización está presente
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendErrorResponse(
      res,
      401,
      'No se proporcionó token de autenticación',
      'Autenticación requerida'
    );
  }

  // Extraer el token
  const token = authHeader.split(' ')[1];

  try {
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Adjuntar la información del usuario al objeto req
    req.user = decoded.user;

    // Pasar al siguiente middleware o controlador
    next();
  } catch (error) {
    console.error('Error en la autenticación:', error.message);
    return sendErrorResponse(
      res,
      401,
      'Token inválido o expirado',
      'Autenticación fallida'
    );
  }
};

export default authMiddleware;






