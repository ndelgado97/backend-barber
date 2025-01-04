import { validationResult } from 'express-validator';

/**
 * Middleware para validar los resultados de las validaciones realizadas con express-validator.
 * Si hay errores, responde con un objeto JSON que contiene los detalles de los errores.
 * Si no hay errores, pasa el control al siguiente middleware o controlador.
 */
const validarCampos = (req, res, next) => {
  const errores = validationResult(req);

  if (!errores.isEmpty()) {
    // Mapeo de los errores para una respuesta más limpia
    const extractedErrors = errores.array().map(err => {
      return { [err.param]: err.msg };
    });

    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: extractedErrors,
    });
  }

  next();
};

export default validarCampos;
