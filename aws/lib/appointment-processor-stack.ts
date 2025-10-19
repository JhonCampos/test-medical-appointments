import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import { aws_sqs as sqs } from 'aws-cdk-lib';
import { aws_events as events } from 'aws-cdk-lib';
import { aws_lambda_nodejs as lambda_nodejs } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_lambda_event_sources as event_sources } from 'aws-cdk-lib';

/**
 * Propiedades que el AppointmentProcessorStack espera recibir del AppointmentApiStack.
 */
export interface AppointmentProcessorStackProps extends cdk.StackProps {
  readonly appointmentsQueuePE: sqs.IQueue;
  readonly appointmentsQueueCL: sqs.IQueue;
  readonly appointmentEventBus: events.IEventBus;
}

export class AppointmentProcessorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppointmentProcessorStackProps) {
    super(scope, id, props);

    // --- Lambda Bundling Configuration ---
    const bundlingConfig: lambda_nodejs.BundlingOptions = {
        externalModules: ['@aws-sdk/*'],
        tsconfig: './tsconfig.json',
    };

    // --- Recurso: Lambda para procesar citas de Perú (PE) ---
    const processPEHandler = new lambda_nodejs.NodejsFunction(this, 'ProcessPEHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: './services/appointment-processor/src/handlers/processPE.ts',
      bundling: bundlingConfig,
      environment: {
        EVENT_BUS_NAME: props.appointmentEventBus.eventBusName,
      },
    });
    
    // Conectar el handler de PE a su cola SQS correspondiente
    processPEHandler.addEventSource(new event_sources.SqsEventSource(props.appointmentsQueuePE));
    // Otorgar permisos para publicar eventos en EventBridge
    props.appointmentEventBus.grantPutEventsTo(processPEHandler);

    // --- Recurso: Lambda para procesar citas de Chile (CL) ---
    const processCLHandler = new lambda_nodejs.NodejsFunction(this, 'ProcessCLHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: './services/appointment-processor/src/handlers/processCL.ts',
      bundling: bundlingConfig,
      environment: {
        EVENT_BUS_NAME: props.appointmentEventBus.eventBusName,
      },
    });

    // Conectar el handler de CL a su cola SQS correspondiente
    processCLHandler.addEventSource(new event_sources.SqsEventSource(props.appointmentsQueueCL));
    // Otorgar permisos para publicar eventos en EventBridge
    props.appointmentEventBus.grantPutEventsTo(processCLHandler);
  }
}