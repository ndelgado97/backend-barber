import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const horarioSchema = new Schema(
  {
    barbero: {
      type: Schema.Types.ObjectId,
      ref: 'Barbero',
      required: true,
    },
    diaSemana: {
      type: Number,
      enum: [0, 1, 2, 3, 4, 5, 6], // 0: Domingo, 1: Lunes, ..., 6: Sábado
      required: true,
    },
    horaInicio: {
      type: String, // Formato "HH:MM"
      required: true,
      match: [/^[0-2]\d:[0-5]\d$/, 'Hora de inicio inválida'],
    },
    horaFin: {
      type: String, // Formato "HH:MM"
      required: true,
      match: [/^[0-2]\d:[0-5]\d$/, 'Hora de fin inválida'],
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
horarioSchema.pre('save', function (next) {
  this.actualizadoEn = Date.now();
  next();
});

// Validación para asegurar que horaFin es posterior a horaInicio
horarioSchema.pre('save', function (next) {
  const [horaInicioHoras, horaInicioMinutos] = this.horaInicio.split(':').map(Number);
  const [horaFinHoras, horaFinMinutos] = this.horaFin.split(':').map(Number);

  const inicio = horaInicioHoras * 60 + horaInicioMinutos;
  const fin = horaFinHoras * 60 + horaFinMinutos;

  if (fin <= inicio) {
    return next(new Error('La hora de fin debe ser posterior a la hora de inicio'));
  }
  next();
});

export default model('Horario', horarioSchema);
