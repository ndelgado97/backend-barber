import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const servicioSchema = new Schema(
  {
    barbero: {
      type: Schema.Types.ObjectId,
      ref: 'Barbero',
      required: true,
    },
    nombre: {
      type: String,
      required: [true, 'El nombre del servicio es obligatorio'],
      trim: true,
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción del servicio es obligatoria'],
      trim: true,
      maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
    },
    precio: {
      type: Number,
      required: [true, 'El precio del servicio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    duracion: {
      type: Number, // Duración en minutos
      required: [true, 'La duración del servicio es obligatoria'],
      min: [1, 'La duración debe ser al menos de 1 minuto'],
    },
    imagenUrl: {
      type: String, // URL de la imagen almacenada en S3
      required: [true, 'La imagen del servicio es obligatoria'],
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
servicioSchema.pre('save', function (next) {
  this.actualizadoEn = Date.now();
  next();
});

export default model('Servicio', servicioSchema);
