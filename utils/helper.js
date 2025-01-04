import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';

// Configurar variables de entorno
dotenv.config();

// Configuración de AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Asegúrate de tener esta variable en tu .env
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Asegúrate de tener esta variable en tu .env
  region: process.env.AWS_REGION, // Asegúrate de tener esta variable en tu .env
});

/**
 * Sube un archivo a S3 y devuelve la URL pública del archivo.
 * @param {Object} file - Archivo recibido de Multer.
 * @returns {Promise<String>} - URL pública del archivo en S3.
 */
export const uploadFileToS3 = (file) => {
  return new Promise((resolve, reject) => {
    const fileExtension = path.extname(file.originalname);
    const fileKey = `${uuidv4()}${fileExtension}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME, // Asegúrate de tener esta variable en tu .env
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // Hace que el archivo sea accesible públicamente
    };

    s3.upload(params, (err, data) => {
      if (err) {
        console.error('Error al subir el archivo a S3:', err);
        reject(err);
      } else {
        resolve(data.Location); // URL del archivo
      }
    });
  });
};

/**
 * Elimina un archivo de S3 utilizando su clave (key).
 * @param {String} fileKey - Clave del archivo en S3.
 * @returns {Promise}
 */
export const deleteFileFromS3 = (fileKey) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME, // Asegúrate de tener esta variable en tu .env
      Key: fileKey,
    };

    s3.deleteObject(params, (err, data) => {
      if (err) {
        console.error('Error al eliminar el archivo de S3:', err);
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * Obtiene la URL pública de un archivo almacenado en S3.
 * @param {String} fileKey - Clave del archivo en S3.
 * @returns {String} - URL pública del archivo.
 */
export const getS3FileUrl = (fileKey) => {
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
};

/**
 * Genera un identificador único utilizando uuid.
 * @returns {String} - UUID v4.
 */
export const generateUniqueId = () => {
  return uuidv4();
};

/**
 * Formatea una fecha en el formato DD/MM/YYYY.
 * @param {Date} date - Objeto Date.
 * @returns {String} - Fecha formateada.
 */
export const formatDate = (date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Los meses empiezan en 0
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Envía una respuesta estándar de éxito.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Number} statusCode - Código de estado HTTP.
 * @param {Object} data - Datos a enviar en la respuesta.
 * @param {String} message - Mensaje de éxito.
 */
export const sendSuccessResponse = (res, statusCode, data, message = 'Operación exitosa') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Envía una respuesta estándar de error.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Number} statusCode - Código de estado HTTP.
 * @param {String} error - Detalles del error.
 * @param {String} message - Mensaje de error.
 */
export const sendErrorResponse = (res, statusCode, error, message = 'Operación fallida') => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};
