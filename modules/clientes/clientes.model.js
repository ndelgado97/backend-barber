import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const clienteSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Email inválido'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false, // No se selecciona por defecto
    },
    profilePicture: {
      type: String, // URL o ruta de la imagen
      default: 'uploads/profilePictures/default.png', // Imagen por defecto
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
clienteSchema.pre('save', function (next) {
  this.actualizadoEn = Date.now();
  next();
});

export default model('Cliente', clienteSchema);
