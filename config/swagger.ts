// config/swagger.ts
export default {
  path: '',
  title: 'LMS API Documentation',
  version: '1.0.0',
  description: 'Rural Spark LMS API interactive documentation',
  tagIndex: 2,
  info: {
    title: 'LMS API',
    version: '1.0.0',
    description: 'Interactive API Documentation for LMS Backend',
  },
  snakeCase: true,
  debug: false,
  ignore: ['/swagger', '/docs', '/scalar'],
  preferredPutPatch: 'PUT',
  common: {
    parameters: {},
    headers: {},
  },
  productionEnv: 'none', // Allows live generation even in production mode
  securitySchemes: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter your Bearer token here',
    },
  },
  defaultSecurity: [{ BearerAuth: [] }],
}