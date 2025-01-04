// modules/barberos/barberos.controller.js

import Barbero from './barberos.model.js';
import Suscripcion from '../suscripcion/suscripcion.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { validationResult } from 'express-validator';
import { 
  uploadFileToS3, 
  deleteFileFromS3, 
  sendSuccessResponse, 
  sendErrorResponse 
} from '../../utils/helper.js';

dotenv.config();

// Función para generar JWT
const generarToken = (id, role) => {
  return jwt.sign({ user: { id, role } }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION || '7d',
  });
};

// Registrar Barbero
export const registrarBarbero = async (req, res) => {
  // Validar campos
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return sendErrorResponse(res, 400, errores.array(), 'Datos inválidos');
  }

  const { name, email, password } = req.body;
  const profilePictureFile = req.file; // Supone que estás usando Multer para 'profilePicture'
  const documentoIdentidadFile = req.fileDocumento; // Supone que estás usando Multer para 'documentoIdentidad'

  try {
    // Verificar si el barbero ya existe
    let barbero = await Barbero.findOne({ email });
    if (barbero) {
      return sendErrorResponse(res, 400, null, 'Barbero ya registrado');
    }

    // Subir Profile Picture a S3 si se proporcionó
    let profilePictureUrl = null;
    if (profilePictureFile) {
      profilePictureUrl = await uploadFileToS3(profilePictureFile);
    } else {
      // Asigna una URL por defecto o maneja según tu lógica
      profilePictureUrl = 'https://your-default-image-url.com/default-profile.png';
    }

    // Subir Documento de Identidad a S3 si se proporcionó
    let documentoIdentidadUrl = null;
    if (documentoIdentidadFile) {
      documentoIdentidadUrl = await uploadFileToS3(documentoIdentidadFile);
    } else {
      // Asigna una URL por defecto o maneja según tu lógica
      documentoIdentidadUrl = 'https://your-default-document-url.com/default-document.pdf';
    }

    // Crear nuevo barbero
    barbero = new Barbero({
      name,
      email,
      password,
      profilePicture: profilePictureUrl,
      documentoIdentidad: documentoIdentidadUrl,
      role: 'barber', // Asegurando que el rol sea 'barber'
    });

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    barbero.password = await bcrypt.hash(password, salt);

    await barbero.save();

    // Generar JWT
    const token = generarToken(barbero._id, barbero.role);

    sendSuccessResponse(res, 201, {
      token,
      barbero: {
        id: barbero._id,
        name: barbero.name,
        email: barbero.email,
        profilePicture: barbero.profilePicture,
        documentoIdentidad: barbero.documentoIdentidad,
      },
    }, 'Barbero registrado exitosamente');
  } catch (error) {
    console.error('Error en el registro del barbero:', error.message);
    sendErrorResponse(res, 500, error.message, 'Error del servidor');
  }
};

// Login de Barbero
export const loginBarbero = async (req, res) => {
  // Validar campos
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return sendErrorResponse(res, 400, errores.array(), 'Datos inválidos');
  }

  const { email, password } = req.body;

  try {
    // Verificar si el barbero existe
    const barbero = await Barbero.findOne({ email }).select('+password');
    if (!barbero) {
      return sendErrorResponse(res, 400, null, 'Credenciales inválidas');
    }

    // Verificar contraseña
    const esIgual = await bcrypt.compare(password, barbero.password);
    if (!esIgual) {
      return sendErrorResponse(res, 400, null, 'Credenciales inválidas');
    }

    // Generar JWT
    const token = generarToken(barbero._id, barbero.role);

    sendSuccessResponse(res, 200, {
      token,
      barbero: {
        id: barbero._id,
        name: barbero.name,
        email: barbero.email,
        profilePicture: barbero.profilePicture,
        documentoIdentidad: barbero.documentoIdentidad,
      },
    }, 'Login exitoso');
  } catch (error) {
    console.error('Error en el login del barbero:', error.message);
    sendErrorResponse(res, 500, error.message, 'Error del servidor');
  }
};

// Obtener Perfil del Barbero
export const obtenerPerfilBarbero = async (req, res) => {
  try {
    const barbero = await Barbero.findById(req.user.id)
      .populate('suscripcion')
      .populate('horarios')
      .populate('servicios')
      .select('-password');

    if (!barbero) {
      return sendErrorResponse(res, 404, null, 'Barbero no encontrado');
    }

    sendSuccessResponse(res, 200, barbero, 'Perfil obtenido exitosamente');
  } catch (error) {
    console.error('Error al obtener el perfil del barbero:', error.message);
    sendErrorResponse(res, 500, error.message, 'Error del servidor');
  }
};

// Actualizar Perfil del Barbero
export const actualizarPerfilBarbero = async (req, res) => {
  // Validar campos
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return sendErrorResponse(res, 400, errores.array(), 'Datos inválidos');
  }

  const { name, email, password } = req.body;
  const profilePictureFile = req.file; // Supone que estás usando Multer para 'profilePicture'
  const documentoIdentidadFile = req.fileDocumento; // Supone que estás usando Multer para 'documentoIdentidad'

  try {
    const barbero = await Barbero.findById(req.user.id);
    if (!barbero) {
      return sendErrorResponse(res, 404, null, 'Barbero no encontrado');
    }

    // Construir objeto con los campos a actualizar
    const camposActualizar = {};
    if (name) camposActualizar.name = name;
    if (email) camposActualizar.email = email;

    // Manejar Profile Picture
    if (profilePictureFile) {
      // Eliminar la foto anterior si no es la por defecto
      if (barbero.profilePicture && barbero.profilePicture !== 'https://your-default-image-url.com/default-profile.png') {
        const oldFileKey = barbero.profilePicture.split('.amazonaws.com/')[1];
        await deleteFileFromS3(oldFileKey);
      }

      // Subir la nueva foto
      const newProfilePictureUrl = await uploadFileToS3(profilePictureFile);
      camposActualizar.profilePicture = newProfilePictureUrl;
    }

    // Manejar Documento de Identidad
    if (documentoIdentidadFile) {
      // Eliminar el documento anterior si no es el por defecto
      if (barbero.documentoIdentidad && barbero.documentoIdentidad !== 'https://your-default-document-url.com/default-document.pdf') {
        const oldDocKey = barbero.documentoIdentidad.split('.amazonaws.com/')[1];
        await deleteFileFromS3(oldDocKey);
      }

      // Subir el nuevo documento
      const newDocumentoIdentidadUrl = await uploadFileToS3(documentoIdentidadFile);
      camposActualizar.documentoIdentidad = newDocumentoIdentidadUrl;
    }

    // Manejar Contraseña
    if (password) {
      const salt = await bcrypt.genSalt(10);
      camposActualizar.password = await bcrypt.hash(password, salt);
    }

    // Actualizar barbero
    const barberoActualizado = await Barbero.findByIdAndUpdate(
      req.user.id,
      { $set: camposActualizar },
      { new: true, runValidators: true, context: 'query' }
    ).select('-password');

    sendSuccessResponse(res, 200, barberoActualizado, 'Perfil actualizado exitosamente');
  } catch (error) {
    console.error('Error al actualizar el perfil del barbero:', error.message);
    sendErrorResponse(res, 500, error.message, 'Error del servidor');
  }
};

// Suscribirse al Sistema
export const suscribirse = async (req, res) => {
  const { suscripcionId } = req.body;

  try {
    const suscripcion = await Suscripcion.findById(suscripcionId);
    if (!suscripcion) {
      return sendErrorResponse(res, 404, null, 'Suscripción no encontrada');
    }

    const barbero = await Barbero.findById(req.user.id);
    if (!barbero) {
      return sendErrorResponse(res, 404, null, 'Barbero no encontrado');
    }

    // Actualizar la suscripción del barbero
    barbero.suscripcion = suscripcion._id;
    await barbero.save();

    sendSuccessResponse(res, 200, suscripcion, 'Suscripción actualizada exitosamente');
  } catch (error) {
    console.error('Error al suscribirse:', error.message);
    sendErrorResponse(res, 500, error.message, 'Error del servidor');
  }
};
