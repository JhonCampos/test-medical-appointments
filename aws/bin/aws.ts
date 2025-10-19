#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppointmentApiStack } from '../lib/appointment-api-stack';
import { AppointmentProcessorStack } from '../lib/appointment-processor-stack';

const app = new cdk.App();

// Definimos los tags que se aplicarán a todos los recursos de ambas stacks
const tags = {
  'app-id': 'test-medical-appoinments',
  'app-center-cost': 'test-medical-appoinments',
  'app-env': 'test',
};

// Stack principal que contiene la API, base de datos y sistema de eventos primario
const apiStack = new AppointmentApiStack(app, 'AppointmentApiStack', {
  stackName: 'appointment-api-stack-dev',
  tags: tags,
  // description: 'Stack for the Medical Appointments API and core resources.',
});

// Stack para los procesadores asíncronos de citas
const processorStack = new AppointmentProcessorStack(app, 'AppointmentProcessorStack', {
    stackName: 'appointment-processor-stack-dev',
    tags: tags,
    // Pasamos las colas y el bus de eventos creados en el ApiStack al ProcessorStack
    appointmentsQueuePE: apiStack.appointmentsQueuePE,
    appointmentsQueueCL: apiStack.appointmentsQueueCL,
    appointmentEventBus: apiStack.appointmentEventBus,
    // description: 'Stack for the asynchronous appointment processors.',
});

// Añadimos una dependencia explícita para asegurar que el ApiStack se despliegue primero,
// ya que el ProcessorStack depende de los recursos que este crea.
processorStack.addDependency(apiStack);