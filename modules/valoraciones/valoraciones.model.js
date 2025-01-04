import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const valoracionSchema = new Schema(
  {
    cliente: {
      type: Schema.Types.ObjectId,
      ref: 'Cliente',
      required: true,
    },
    barbero: {
      type: Schema.Types.ObjectId,
      ref: 'Barbero',
      required: true,
    },
    puntuacion: {
      type: Number,
      required: [true, 'La puntuación es obligatoria'],
      min: [1, 'La puntuación mínima es 1'],
      max: [5, 'La puntuación máxima es 5'],
    },
    comentario: {
      type: String,
      trim: true,
      maxlength: [500, 'El comentario no puede exceder 500 caracteres'],
      default: '',
    },
    fecha: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Índice único para evitar múltiples valoraciones del mismo cliente al mismo barbero
valoracionSchema.index({ cliente: 1, barbero: 1 }, { unique: true });

export default model('Valoracion', valoracionSchema);
