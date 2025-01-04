import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const barberoSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre completo es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor, ingresa un email válido',
      ],
    },
    //number
    //carnet
    //rut
    //dirección
    //latitud y longitud, opcional
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false, // No devolver la contraseña por defecto
    },
    profilePicture: {
      type: String,
      default: 'https://your-default-image-url.com/default-profile.png',
    },
    documentoIdentidad: {
      type: String,
      default: 'https://your-default-document-url.com/default-document.pdf',
    },
    suscripcion: {
      type: Schema.Types.ObjectId,
      ref: 'Suscripcion',
    },
    horarios: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Horario',
      },
    ],
    servicios: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Servicio',
      },
    ],
    role: {
      type: String,
      enum: ['barber', 'admin'],
      default: 'barber',
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
barberoSchema.pre('save', function (next) {
  this.actualizadoEn = Date.now();
  next();
});

export default model('Barbero', barberoSchema);
