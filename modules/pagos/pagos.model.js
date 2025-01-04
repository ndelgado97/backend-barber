import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const pagoSchema = new Schema(
  {
    barbero: {
      type: Schema.Types.ObjectId,
      ref: 'Barbero',
      required: true,
    },
    monto: {
      type: Number,
      required: [true, 'El monto es obligatorio'],
      min: [1, 'El monto debe ser al menos 1 CLP'],
    },
    moneda: {
      type: String,
      enum: ['CLP'],
      default: 'CLP',
    },
    estado: {
      type: String,
      enum: ['Pendiente', 'Aprobado', 'Rechazado', 'En Proceso'],
      default: 'Pendiente',
    },
    referencia: {
      type: String,
      required: true,
      unique: true,
    },
    transactionDetails: {
      type: Object, // Almacena detalles de la transacción de Mercado Pago
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
pagoSchema.pre('save', function (next) {
  this.actualizadoEn = Date.now();
  next();
});

export default model('Pago', pagoSchema);
