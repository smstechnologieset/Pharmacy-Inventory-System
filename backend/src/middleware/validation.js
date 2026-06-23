import { ValidationError } from "../utils/AppError.js";

/**
 * Validate required fields in request body
 * Usage: app.post('/route', validateBody(['field1', 'field2']), handler)
 */
export const validateBody = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = [];

    for (const field of requiredFields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new ValidationError(
        `Missing required fields: ${missingFields.join(", ")}`,
      );
    }

    next();
  };
};

/**
 * Validate required query parameters
 * Usage: app.get('/route', validateQuery(['param1', 'param2']), handler)
 */
export const validateQuery = (requiredParams) => {
  return (req, res, next) => {
    const missingParams = [];

    for (const param of requiredParams) {
      if (!req.query[param]) {
        missingParams.push(param);
      }
    }

    if (missingParams.length > 0) {
      throw new ValidationError(
        `Missing required query parameters: ${missingParams.join(", ")}`,
      );
    }

    next();
  };
};

/**
 * Validate request body against a schema
 * Usage: app.post('/route', validateSchema(schema), handler)
 */
export const validateSchema = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message).join(", ");
      throw new ValidationError(messages);
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

export default { validateBody, validateQuery, validateSchema };
