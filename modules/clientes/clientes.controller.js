import Cliente from './clientes.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { validationResult } from 'express-validator';

dotenv.config();

// Función para generar JWT
const generarToken = (id, role) => {
  return jwt.sign({ user: { id, role } }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Registro de Cliente
export const registrarCliente = async (req, res) => {
  // Validar campos
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  const { name, email, password } = req.body;
  const profilePicture = req.file ? req.file.path : 'uploads/profilePictures/default.png';

  try {
    // Verificar si el cliente ya existe
    let cliente = await Cliente.findOne({ email });
    if (cliente) {
      return res.status(400).json({ msg: 'Cliente ya registrado' });
    }

    // Crear nuevo cliente
    cliente = new Cliente({
      name,
      email,
      password,
      profilePicture,
    });

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    cliente.password = await bcrypt.hash(password, salt);

    await cliente.save();

    // Generar JWT
    const token = generarToken(cliente._id, 'client');

    res.status(201).json({
      token,
      cliente: {
        id: cliente._id,
        name: cliente.name,
        email: cliente.email,
        profilePicture: cliente.profilePicture,
      },
    });
  } catch (error) {
    console.error('Error en el registro del cliente:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Login de Cliente
export const loginCliente = async (req, res) => {
  // Validar campos
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  const { email, password } = req.body;

  try {
    // Verificar si el cliente existe
    const cliente = await Cliente.findOne({ email }).select('+password');
    if (!cliente) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const esIgual = await bcrypt.compare(password, cliente.password);
    if (!esIgual) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    // Generar JWT
    const token = generarToken(cliente._id, 'client');

    res.json({
      token,
      cliente: {
        id: cliente._id,
        name: cliente.name,
        email: cliente.email,
        profilePicture: cliente.profilePicture,
      },
    });
  } catch (error) {
    console.error('Error en el login del cliente:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Obtener Perfil del Cliente
export const obtenerPerfilCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.user.id).select('-password');

    if (!cliente) {
      return res.status(404).json({ msg: 'Cliente no encontrado' });
    }

    res.json(cliente);
  } catch (error) {
    console.error('Error al obtener el perfil del cliente:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Actualizar Perfil del Cliente
export const actualizarPerfilCliente = async (req, res) => {
  // Validar campos
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }

  const { name, email, password } = req.body;
  const profilePicture = req.file ? req.file.path : undefined;

  // Construir objeto con los campos a actualizar
  const camposActualizar = {};
  if (name) camposActualizar.name = name;
  if (email) camposActualizar.email = email;
  if (profilePicture) camposActualizar.profilePicture = profilePicture;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    camposActualizar.password = await bcrypt.hash(password, salt);
  }

  try {
    // Actualizar cliente
    const cliente = await Cliente.findByIdAndUpdate(
      req.user.id,
      { $set: camposActualizar },
      { new: true, runValidators: true, context: 'query' }
    ).select('-password');

    res.json(cliente);
  } catch (error) {
    console.error('Error al actualizar el perfil del cliente:', error.message);
    res.status(500).send('Error del servidor');
  }
};
