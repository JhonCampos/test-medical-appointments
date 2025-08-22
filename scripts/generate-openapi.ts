import { 
  CreateAppointmentSchema, 
  ListAppointmentsRequestSchema, 
  GetAppointmentRequestSchema, // [!code ++]
  AppointmentResponseSchema 
} from '../packages/core/src/application/dtos/AppointmentDtos';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod/v4';
import * as yaml from 'yaml';

// ==============================================================================
// PASO 1: Generar todos los JSON Schemas necesarios desde Zod en memoria.
// ==============================================================================
console.log('Generando JSON Schemas desde Zod en memoria...');

// --- Esquemas de la aplicación ---
const createAppointmentRequestSchema = z.toJSONSchema(CreateAppointmentSchema);
const listAppointmentsParamsSchema = z.toJSONSchema(ListAppointmentsRequestSchema);
const getAppointmentParamsSchema = z.toJSONSchema(GetAppointmentRequestSchema); // [!code ++]
const appointmentResponseSchema = z.toJSONSchema(AppointmentResponseSchema);
const appointmentsListResponseSchema = z.toJSONSchema(z.array(AppointmentResponseSchema));

// --- Esquema reutilizable para respuestas de error ---
const ZodErrorIssueSchema = z.object({
  code: z.string(),
  path: z.array(z.union([z.string(), z.number()])),
  message: z.string(),
});

const ErrorResponseSchema = z.object({
  code: z.string().describe('Código de error estandarizado (ej. BAD_REQUEST).'),
  message: z.string().describe('Mensaje legible que describe el error.'),
  errors: z.array(ZodErrorIssueSchema).optional().describe('Lista de errores de validación detallados (opcional).'),
});
const errorResponseJsonSchema = z.toJSONSchema(ErrorResponseSchema);


console.log('✅ Schemas generados.');

// ==============================================================================
// PASO 2: Construir el objeto de la especificación OpenAPI.
// ==============================================================================
console.log('Construyendo la especificación OpenAPI...');

const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'API de Agendamiento de Citas Médicas',
    version: '1.0.0',
    description: 'API para gestionar la creación y consulta de citas médicas.',
  },
  servers: [{ url: '/dev' }],
  paths: {
    '/appointments': {
      post: {
        summary: 'Crear una nueva cita médica',
        description: 'Registra una nueva cita y la envía para procesamiento asíncrono.',
        tags: ['Appointments'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateAppointmentRequest' },
            },
          },
        },
        responses: {
          '202': {
            description: 'Cita aceptada para procesamiento.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AppointmentResponse' },
              },
            },
          },
          '400': {
            description: 'Datos de la solicitud inválidos.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/appointments/{insuredId}': {
      get: {
        summary: 'Listar citas por asegurado',
        description: 'Obtiene todas las citas médicas registradas para un ID de asegurado específico.',
        tags: ['Appointments'],
        parameters: [
          {
            name: 'insuredId',
            in: 'path',
            required: true,
            schema: listAppointmentsParamsSchema.properties?.insuredId,
          },
        ],
        responses: {
          '200': {
            description: 'Lista de citas obtenida exitosamente.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AppointmentsListResponse' },
              },
            },
          },
          '400': {
            description: 'El ID del asegurado es inválido.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          '404': {
            description: 'Asegurado no encontrado o sin citas.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/appointments/{insuredId}/{appointmentId}': { // [!code ++]
      get: { // [!code ++]
        summary: 'Obtener una cita específica', // [!code ++]
        description: 'Obtiene los detalles de una cita médica específica por su ID.', // [!code ++]
        tags: ['Appointments'], // [!code ++]
        parameters: [ // [!code ++]
          { // [!code ++]
            name: 'insuredId', // [!code ++]
            in: 'path', // [!code ++]
            required: true, // [!code ++]
            schema: getAppointmentParamsSchema.properties?.insuredId, // [!code ++]
          }, // [!code ++]
          { // [!code ++]
            name: 'appointmentId', // [!code ++]
            in: 'path', // [!code ++]
            required: true, // [!code ++]
            schema: getAppointmentParamsSchema.properties?.appointmentId, // [!code ++]
          }, // [!code ++]
        ], // [!code ++]
        responses: { // [!code ++]
          '200': { // [!code ++]
            description: 'Detalles de la cita obtenidos exitosamente.', // [!code ++]
            content: { // [!code ++]
              'application/json': { // [!code ++]
                schema: { $ref: '#/components/schemas/AppointmentResponse' }, // [!code ++]
              }, // [!code ++]
            }, // [!code ++]
          }, // [!code ++]
          '400': { // [!code ++]
            description: 'Uno o más IDs son inválidos.', // [!code ++]
            content: { // [!code ++]
              'application/json': { // [!code ++]
                schema: { $ref: '#/components/schemas/ErrorResponse' }, // [!code ++]
              }, // [!code ++]
            }, // [!code ++]
          }, // [!code ++]
          '404': { // [!code ++]
            description: 'La cita no fue encontrada.', // [!code ++]
            content: { // [!code ++]
              'application/json': { // [!code ++]
                schema: { $ref: '#/components/schemas/ErrorResponse' }, // [!code ++]
              }, // [!code ++]
            }, // [!code ++]
          }, // [!code ++]
        }, // [!code ++]
      }, // [!code ++]
    }, // [!code ++]
  },
  // Inyectar los schemas generados en la sección de componentes.
  components: {
    schemas: {
      CreateAppointmentRequest: createAppointmentRequestSchema,
      ListAppointmentsParams: listAppointmentsParamsSchema,
      GetAppointmentParams: getAppointmentParamsSchema, // [!code ++]
      AppointmentResponse: appointmentResponseSchema,
      AppointmentsListResponse: appointmentsListResponseSchema,
      ErrorResponse: errorResponseJsonSchema,
    },
  },
};

console.log('✅ Especificación construida.');

// ==============================================================================
// PASO 3: Escribir el archivo openapi.yaml final.
// ==============================================================================
const yamlSpec = yaml.stringify(openApiSpec);
const outputPath = path.join(__dirname, '../services/appointment-api/openapi.yaml');
fs.writeFileSync(outputPath, yamlSpec);

console.log(`\n🚀 Especificación OpenAPI generada exitosamente en: ${outputPath}`);