import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const citaSchema = new Schema(
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
    servicios: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Servicio',
      },
    ],
    fecha: {
      type: Date,
      required: true,
    },
    estado: {
      type: String,
      enum: ['Confirmada', 'Pendiente', 'Cancelada'],
      default: 'Pendiente',
    },
    metodoPago: {
      type: String,
      enum: ['Transferencia', 'Efectivo', 'Tarjeta'],
      required: true,
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'El total no puede ser negativo'],
    },
    comentarios: {
      type: String,
      trim: true,
      maxlength: [500, 'Los comentarios no pueden exceder 500 caracteres'],
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
citaSchema.pre('save', function (next) {
  this.actualizadoEn = Date.now();
  next();
});

export default model('Cita', citaSchema);
