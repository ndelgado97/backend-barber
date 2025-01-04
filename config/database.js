// config/database.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { sendErrorResponse } from '../utils/helper.js'; // Asegúrate de que esta ruta sea correcta

dotenv.config();

/**
 * Función para conectar a MongoDB utilizando Mongoose.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useFindAndModify: false, // Ya no es necesario en Mongoose 6+
      // useCreateIndex: true,    // Ya no es necesario en Mongoose 6+
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // En caso de error, detener el proceso
    process.exit(1);
  }
};

export default connectDB;
