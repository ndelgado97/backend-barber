import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const notificacionSchema = new Schema(
  {
    usuario: {
      type: Schema.Types.ObjectId,
      refPath: 'tipoUsuario',
      required: true,
    },
    tipoUsuario: {
      type: String,
      enum: ['Barbero', 'Cliente'],
      required: true,
    },
    tipo: {
      type: String,
      enum: [
        'ReservaCreada',
        'ReservaCancelada',
        'Recordatorio',
        'NuevaValoración',
        'Baneo',
        // Agrega más tipos según tus necesidades
      ],
      required: true,
    },
    mensaje: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'El mensaje no puede exceder 500 caracteres'],
    },
    leido: {
      type: Boolean,
      default: false,
    },
    datosAdicionales: {
      type: Schema.Types.Mixed,
      default: {},
      // Puedes usar esto para almacenar información adicional como IDs de citas, etc.
    },
    creadoEn: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default model('Notificacion', notificacionSchema);
