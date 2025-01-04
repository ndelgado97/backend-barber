import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const horarioBloqueadoSchema = new Schema(
  {
    barbero: {
      type: Schema.Types.ObjectId,
      ref: 'Barbero',
      required: true,
    },
    tipo: {
      type: String,
      enum: ['Comida', 'Descanso', 'Otro'],
      required: true,
      default: 'Otro',
    },
    fechaInicio: {
      type: Date,
      required: true,
    },
    fechaFin: {
      type: Date,
      required: true,
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [200, 'La descripción no puede exceder 200 caracteres'],
      default: '',
    },
    creadoEn: {
      type: Date,
      default: Date.now,
    },
    actualizadoEn: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware para actualizar la fecha de actualización
horarioBloqueadoSchema.pre('save', function (next) {
  this.actualizadoEn = Date.now();
  next();
});

// Validación para asegurar que fechaFin es posterior a fechaInicio
horarioBloqueadoSchema.pre('save', function (next) {
  if (this.fechaFin <= this.fechaInicio) {
    return next(new Error('La fecha de fin debe ser posterior a la fecha de inicio'));
  }
  next();
});

export default model('HorarioBloqueado', horarioBloqueadoSchema);
