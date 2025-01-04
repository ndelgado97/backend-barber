import Baneo from './baneos.model.js';
import Barbero from '../barberos/barberos.model.js';
import Cliente from '../clientes/clientes.model.js';
import { validationResult } from 'express-validator';

// Función para obtener el modelo correspondiente basado en tipoUsuario
const getUsuarioModel = (tipoUsuario) => {
  switch (tipoUsuario) {
    case 'Barbero':
      return Barbero;
    case 'Cliente':
      return Cliente;
    default:
      return null;
  }
};

// Banear un usuario
export const banearUsuario = async (req, res) => {
  // Validar los datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errores: errors.array() });
  }

  const { usuarioBaneado, tipoUsuario, motivo } = req.body;
  const baneadoPor = req.user._id; // Asumiendo que tienes middleware de autenticación

  try {
    // Obtener el modelo del usuario basado en tipoUsuario
    const UsuarioModel = getUsuarioModel(tipoUsuario);
    if (!UsuarioModel) {
      return res.status(400).json({ msg: 'Tipo de usuario inválido' });
    }

    // Verificar si el usuario existe
    const usuario = await UsuarioModel.findById(usuarioBaneado);
    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    // Verificar si el usuario ya está baneado
    const existeBaneo = await Baneo.findOne({
      usuarioBaneado,
      tipoUsuario,
      fechaDesbaneo: { $exists: false },
    });
    if (existeBaneo) {
      return res.status(400).json({ msg: 'El usuario ya está baneado' });
    }

    // Crear un nuevo registro de baneo
    const nuevoBaneo = new Baneo({
      usuarioBaneado,
      tipoUsuario,
      motivo,
      baneadoPor,
    });

    await nuevoBaneo.save();

    res.status(201).json({ msg: 'Usuario baneado exitosamente', baneo: nuevoBaneo });
  } catch (error) {
    console.error('Error al banear usuario:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Desbanear un usuario
export const desbanearUsuario = async (req, res) => {
  const { id } = req.params; // ID del registro de baneo

  try {
    const baneo = await Baneo.findById(id);
    if (!baneo) {
      return res.status(404).json({ msg: 'Registro de baneo no encontrado' });
    }

    if (baneo.fechaDesbaneo) {
      return res.status(400).json({ msg: 'El usuario ya ha sido desbaneado' });
    }

    baneo.fechaDesbaneo = Date.now();
    await baneo.save();

    res.json({ msg: 'Usuario desbaneado exitosamente', baneo });
  } catch (error) {
    console.error('Error al desbanear usuario:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Obtener todos los baneos (con filtros opcionales)
export const obtenerBaneos = async (req, res) => {
  try {
    const { tipoUsuario, usuarioBaneado } = req.query;

    // Construir el filtro basado en los parámetros de consulta
    const filtro = {};
    if (tipoUsuario) filtro.tipoUsuario = tipoUsuario;
    if (usuarioBaneado) filtro.usuarioBaneado = usuarioBaneado;

    const baneos = await Baneo.find(filtro)
      .populate('usuarioBaneado', 'name email')
      .populate('baneadoPor', 'name email')
      .sort({ fechaBaneo: -1 });

    res.json(baneos);
  } catch (error) {
    console.error('Error al obtener baneos:', error.message);
    res.status(500).send('Error del servidor');
  }
};
