import { 
  CreateAppointmentSchema, 
  ListAppointmentsRequestSchema, 
  AppointmentResponseSchema 
} from '../packages/core/src/application/dtos/AppointmentDtos';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import * as yaml from 'yaml';

// ==============================================================================
// PASO 1: Generar todos los JSON Schemas necesarios desde Zod en memoria.
// ==============================================================================
console.log('Generando JSON Schemas desde Zod en memoria...');

const createAppointmentRequestSchema = z.toJSONSchema(CreateAppointmentSchema);
const listAppointmentsParamsSchema = z.toJSONSchema(ListAppointmentsRequestSchema);
const appointmentResponseSchema =  z.toJSONSchema(AppointmentResponseSchema);
const appointmentsListResponseSchema = z.toJSONSchema(z.array(AppointmentResponseSchema));

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
          },
          '404': {
            description: 'Asegurado no encontrado o sin citas.',
          },
        },
      },
    },
  },
  // Inyectar los schemas generados en la sección de componentes.
  components: {
    schemas: {
      CreateAppointmentRequest: createAppointmentRequestSchema,
      ListAppointmentsParams: listAppointmentsParamsSchema,
      AppointmentResponse: appointmentResponseSchema,
      AppointmentsListResponse: appointmentsListResponseSchema,
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
