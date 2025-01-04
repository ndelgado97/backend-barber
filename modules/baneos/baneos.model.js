import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const baneoSchema = new Schema(
  {
    usuarioBaneado: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'tipoUsuario', // Referencia dinámica
    },
    tipoUsuario: {
      type: String,
      required: true,
      enum: ['Barbero', 'Cliente'], // Tipos de usuarios
    },
    motivo: {
      type: String,
      required: true,
      trim: true,
    },
    fechaBaneo: {
      type: Date,
      default: Date.now,
    },
    fechaDesbaneo: {
      type: Date,
    },
    baneadoPor: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Barbero', // Asumiendo que solo los barberos pueden banear
    },
  },
  {
    timestamps: true,
  }
);

export default model('Baneo', baneoSchema);
