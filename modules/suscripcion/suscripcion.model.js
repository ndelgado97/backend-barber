import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const suscripcionSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre de la suscripción es obligatorio'],
      unique: true,
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    duracion: {
      type: Number, // Duración en meses
      required: [true, 'La duración es obligatoria'],
      min: [1, 'La duración mínima es de 1 mes'],
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
    },
    beneficios: [
      {
        type: String,
        trim: true,
        maxlength: [200, 'Cada beneficio no puede exceder 200 caracteres'],
      },
    ],
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
suscripcionSchema.pre('save', function (next) {
  this.actualizadoEn = Date.now();
  next();
});

export default model('Suscripcion', suscripcionSchema);
