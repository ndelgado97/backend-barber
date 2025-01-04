// =============================
// Importaciones de Dependencias
// =============================
import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

// =============================
// Importaciones de Archivos Locales
// =============================
import connectDB from './config/database.js';

import authMiddleware from './middlewares/auth.middleware.js';

// Importar Rutas de Módulos
import baneosRoutes from './modules/baneos/baneos.routes.js';
import barberosRoutes from './modules/barberos/barberos.routes.js';
import citasRoutes from './modules/citas/citas.routes.js';
import clientesRoutes from './modules/clientes/clientes.routes.js';
import horarioBloqueadoRoutes from './modules/horarioBloqueado/horarioBloqueado.routes.js';
import horariosRoutes from './modules/horarios/horarios.routes.js';
import mensajeriaRoutes from './modules/mensajeria/mensajeria.routes.js';
import notificacionesRoutes from './modules/notificaciones/notificaciones.routes.js';
import pagosRoutes from './modules/pagos/pagos.routes.js';
import serviciosRoutes from './modules/servicios/servicios.routes.js';
import suscripcionRoutes from './modules/suscripcion/suscripcion.routes.js';
import valoracionesRoutes from './modules/valoraciones/valoraciones.routes.js';

// =============================
// Configuración de Variables de Entorno
// =============================
dotenv.config();

// =============================
// Conexión a la Base de Datos
// =============================
connectDB();

// =============================
// Inicialización de la Aplicación Express
// =============================
const app = express();

// =============================
// Configuración de Middlewares
// =============================

// Seguridad con Helmet
app.use(helmet());

// Configuración de CORS
app.use(cors({
  origin: process.env.CLIENT_URL, // Permitir solicitudes desde el cliente especificado
  optionsSuccessStatus: 200,
}));

// Configuración de Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 solicitudes por IP por ventana
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo después de 15 minutos',
});
app.use(limiter);

// Middleware para parsear JSON
app.use(express.json());

// Middleware para parsear datos de formulario (si es necesario)
app.use(express.urlencoded({ extended: true }));

// =============================
// Registro de Rutas de los Módulos
// =============================

// Rutas de Baneos
app.use('/api/baneos', baneosRoutes);

// Rutas de Barberos
app.use('/api/barberos', barberosRoutes);

// Rutas de Citas
app.use('/api/citas', citasRoutes);

// Rutas de Clientes
app.use('/api/clientes', clientesRoutes);

// Rutas de Horarios Bloqueados
app.use('/api/horariobloqueados', horarioBloqueadoRoutes);

// Rutas de Horarios
app.use('/api/horarios', horariosRoutes);

// Rutas de Mensajería
app.use('/api/mensajeria', mensajeriaRoutes);

// Rutas de Notificaciones
app.use('/api/notificaciones', notificacionesRoutes);

// Rutas de Pagos
app.use('/api/pagos', pagosRoutes);

// Rutas de Servicios
app.use('/api/servicios', serviciosRoutes);

// Rutas de Suscripción
app.use('/api/suscripciones', suscripcionRoutes);

// Rutas de Valoraciones
app.use('/api/valoraciones', valoracionesRoutes);

// =============================
// Manejo de Archivos Estáticos
// =============================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir archivos estáticos desde 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =============================
// Ruta Base
// =============================

app.get('/', (req, res) => {
  res.send('Bienvenido al Sistema de Gestión de Barberos');
});

// =============================
// Middleware de Manejo de Errores
// =============================


// =============================
// Iniciar el Servidor
// =============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
