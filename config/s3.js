import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

// Crear una instancia del cliente de S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Subir un archivo a S3.
 * @param {Object} file - El archivo a subir, proveniente de Multer (buffer, originalname, mimetype).
 * @returns {String} - La URL pública del archivo subido.
 */
const uploadFileToS3 = async (file) => {
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
  const fileName = `${uniqueSuffix}-${file.originalname}`;
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read', // Permite lectura pública. Ajusta según tus necesidades.
  };

  try {
    const command = new PutObjectCommand(params);
    await s3.send(command);
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    return fileUrl;
  } catch (error) {
    console.error('Error al subir el archivo a S3:', error);
    throw new Error('No se pudo subir el archivo. Intenta nuevamente.');
  }
};

/**
 * Eliminar un archivo de S3.
 * @param {String} fileUrl - La URL del archivo a eliminar.
 * @returns {Boolean} - Verdadero si la eliminación fue exitosa.
 */
const deleteFileFromS3 = async (fileUrl) => {
  // Extraer el Key del archivo desde la URL
  const urlParts = fileUrl.split(`https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`);
  if (urlParts.length !== 2) {
    throw new Error('URL de archivo inválida');
  }
  const Key = urlParts[1];

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key,
  };

  try {
    const command = new DeleteObjectCommand(params);
    await s3.send(command);
    return true;
  } catch (error) {
    console.error('Error al eliminar el archivo de S3:', error);
    throw new Error('No se pudo eliminar el archivo. Intenta nuevamente.');
  }
};

export { uploadFileToS3, deleteFileFromS3 };
export default s3;
