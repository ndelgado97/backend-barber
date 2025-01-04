import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const mensajeSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'senderModel',
    },
    senderModel: {
      type: String,
      required: true,
      enum: ['Barbero', 'Cliente'],
    },
    recipient: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'recipientModel',
    },
    recipientModel: {
      type: String,
      required: true,
      enum: ['Barbero', 'Cliente'],
    },
    content: {
      type: String,
      required: [true, 'El contenido del mensaje es obligatorio'],
      trim: true,
      maxlength: [1000, 'El mensaje no puede exceder 1000 caracteres'],
    },
  },
  {
    timestamps: true, // Agrega campos createdAt y updatedAt
  }
);

export default model('Mensaje', mensajeSchema);
