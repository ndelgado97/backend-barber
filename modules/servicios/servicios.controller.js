import Servicio from './servicios.model.js';
import { validationResult } from 'express-validator';
import s3 from '../../config/s3.js';
import multerS3 from 'multer-s3';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de multer para subir imágenes a S3
const uploadServicio = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME, // Definido en .env
    acl: 'public-read', // Permisos de acceso
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `servicios/${uniqueSuffix}-${file.originalname}`);
    },
  }),
  fileFilter: function (req, file, cb) {
    // Permitir solo imágenes JPEG y PNG
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single('imagen'); // Nombre del campo en el formulario

// Crear un nuevo servicio
export const crearServicio = async (req, res) => {
  uploadServicio(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // Error de multer
      return res.status(400).json({ msg: err.message });
    } else if (err) {
      // Otro tipo de error
      return res.status(400).json({ msg: err.message });
    }

    // Validar campos
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const { nombre, descripcion, precio, duracion } = req.body;
    const barberoId = req.user._id;

    // Verificar que se haya subido una imagen
    if (!req.file || !req.file.location) {
      return res.status(400).json({ msg: 'La imagen del servicio es obligatoria' });
    }

    try {
      // Crear nuevo servicio
      const servicio = new Servicio({
        barbero: barberoId,
        nombre,
        descripcion,
        precio,
        duracion,
        imagenUrl: req.file.location, // URL de S3
      });

      await servicio.save();

      res.status(201).json({ msg: 'Servicio creado exitosamente', servicio });
    } catch (error) {
      console.error('Error al crear el servicio:', error.message);
      res.status(500).send('Error del servidor');
    }
  });
};

// Obtener todos los servicios de un barbero
export const obtenerServiciosBarbero = async (req, res) => {
  const barberoId = req.user._id;

  try {
    const servicios = await Servicio.find({ barbero: barberoId }).sort({ creadoEn: -1 });
    res.json(servicios);
  } catch (error) {
    console.error('Error al obtener los servicios del barbero:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Obtener un servicio específico
export const obtenerServicio = async (req, res) => {
  const { id } = req.params;
  const barberoId = req.user._id;

  try {
    const servicio = await Servicio.findOne({ _id: id, barbero: barberoId });

    if (!servicio) {
      return res.status(404).json({ msg: 'Servicio no encontrado' });
    }

    res.json(servicio);
  } catch (error) {
    console.error('Error al obtener el servicio:', error.message);
    res.status(500).send('Error del servidor');
  }
};

// Actualizar un servicio
export const actualizarServicio = async (req, res) => {
  uploadServicio(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // Error de multer
      return res.status(400).json({ msg: err.message });
    } else if (err) {
      // Otro tipo de error
      return res.status(400).json({ msg: err.message });
    }

    // Validar campos
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const { id } = req.params;
    const barberoId = req.user._id;
    const { nombre, descripcion, precio, duracion } = req.body;

    try {
      // Encontrar el servicio
      const servicio = await Servicio.findOne({ _id: id, barbero: barberoId });

      if (!servicio) {
        return res.status(404).json({ msg: 'Servicio no encontrado' });
      }

      // Actualizar campos
      if (nombre) servicio.nombre = nombre;
      if (descripcion) servicio.descripcion = descripcion;
      if (precio) servicio.precio = precio;
      if (duracion) servicio.duracion = duracion;

      // Si se subió una nueva imagen, actualizar la URL
      if (req.file && req.file.location) {
        servicio.imagenUrl = req.file.location;
      }

      servicio.actualizadoEn = Date.now();

      await servicio.save();

      res.json({ msg: 'Servicio actualizado exitosamente', servicio });
    } catch (error) {
      console.error('Error al actualizar el servicio:', error.message);
      res.status(500).send('Error del servidor');
    }
  });
};

// Eliminar un servicio
export const eliminarServicio = async (req, res) => {
  const { id } = req.params;
  const barberoId = req.user._id;

  try {
    const servicio = await Servicio.findOne({ _id: id, barbero: barberoId });

    if (!servicio) {
      return res.status(404).json({ msg: 'Servicio no encontrado' });
    }

    // Opcional: Eliminar la imagen de S3
    // Puedes implementar la eliminación de la imagen si es necesario

    await servicio.remove();

    res.json({ msg: 'Servicio eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el servicio:', error.message);
    res.status(500).send('Error del servidor');
  }
};
