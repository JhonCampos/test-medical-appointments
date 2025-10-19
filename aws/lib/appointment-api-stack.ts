import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import { aws_dynamodb as dynamodb } from 'aws-cdk-lib';
import { aws_sns as sns } from 'aws-cdk-lib';
import { aws_sqs as sqs } from 'aws-cdk-lib';
import { aws_sns_subscriptions as subscriptions } from 'aws-cdk-lib';
import { aws_events as events } from 'aws-cdk-lib';
import { aws_events_targets as targets } from 'aws-cdk-lib';
import { aws_lambda_nodejs as lambda_nodejs } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_apigatewayv2 as apigwv2 } from 'aws-cdk-lib';
import { aws_apigatewayv2_integrations as integrations } from 'aws-cdk-lib';
import { aws_lambda_event_sources as event_sources } from 'aws-cdk-lib';

export class AppointmentApiStack extends cdk.Stack {
  
  // Hacemos públicos los recursos que necesitará la otra stack
  public readonly appointmentsQueuePE: sqs.IQueue;
  public readonly appointmentsQueueCL: sqs.IQueue;
  public readonly appointmentEventBus: events.IEventBus;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- Recurso: DynamoDB Table para Citas ---
    const appointmentsTable = new dynamodb.Table(this, 'AppointmentsTable', {
      tableName: 'appointments-table-dev',
      partitionKey: { name: 'insuredId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'appointmentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Ideal para desarrollo, cambiar a RETAIN en producción
    });

    // --- Recurso: SNS Topic para la creación de citas ---
    const appointmentsTopic = new sns.Topic(this, 'AppointmentsTopic', {
      topicName: 'appointments-topic-dev',
    });

    // --- Recursos: SQS Queues para procesamiento por país ---
    this.appointmentsQueuePE = new sqs.Queue(this, 'AppointmentsQueuePE', {
      queueName: 'appointments-queue-pe-dev',
    });

    this.appointmentsQueueCL = new sqs.Queue(this, 'AppointmentsQueueCL', {
      queueName: 'appointments-queue-cl-dev',
    });

    // --- Recursos: Suscripciones de SNS a SQS con filtros por país ---
    appointmentsTopic.addSubscription(
      new subscriptions.SqsSubscription(this.appointmentsQueuePE, {
        rawMessageDelivery: true,
        filterPolicy: {
          countryISO: sns.SubscriptionFilter.stringFilter({
            allowlist: ['PE'],
          }),
        },
      }),
    );

    appointmentsTopic.addSubscription(
      new subscriptions.SqsSubscription(this.appointmentsQueueCL, {
        rawMessageDelivery: true,
        filterPolicy: {
          countryISO: sns.SubscriptionFilter.stringFilter({
            allowlist: ['CL'],
          }),
        },
      }),
    );
    
    // --- Recursos: EventBridge y SQS para Citas Completadas ---
    this.appointmentEventBus = new events.EventBus(this, 'AppointmentEventBus', {
        eventBusName: 'appointment-event-bus-dev',
    });

    const appointmentsCompletionQueue = new sqs.Queue(this, 'AppointmentsCompletionQueue', {
        queueName: 'appointments-completion-queue-dev',
    });

    const eventBusToSqsRule = new events.Rule(this, 'EventBusToSqsRule', {
        eventBus: this.appointmentEventBus,
        eventPattern: {
            source: ['appointment.processor'],
        },
        targets: [new targets.SqsQueue(appointmentsCompletionQueue)],
    });

    // --- Lambda Bundling Configuration ---
    const bundlingConfig: lambda_nodejs.BundlingOptions = {
      externalModules: ['@aws-sdk/*'],
      // Ahora apuntamos al tsconfig.json de la raíz directamente
      tsconfig: './tsconfig.json',
    };

    // --- Recurso: Lambda Handler Principal de la API ---
    const appointmentHandler = new lambda_nodejs.NodejsFunction(this, 'AppointmentHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      // Las rutas ahora son relativas a la raíz del proyecto
      entry: './services/appointment-api/src/handlers/appointment.ts',
      bundling: bundlingConfig,
      environment: {
        DYNAMODB_TABLE_APPOINTMENTS: appointmentsTable.tableName,
        SNS_TOPIC_APPOINTMENTS_ARN: appointmentsTopic.topicArn,
      },
    });

    // Otorgar permisos a la Lambda principal
    appointmentsTable.grantReadWriteData(appointmentHandler);
    appointmentsTopic.grantPublish(appointmentHandler);
    
    // Conectar la Lambda a la cola de completados como un "event source"
    appointmentHandler.addEventSource(new event_sources.SqsEventSource(appointmentsCompletionQueue));

    // --- Recursos: Lambdas para la Documentación Swagger ---
    const swaggerSpecHandler = new lambda_nodejs.NodejsFunction(this, 'SwaggerSpecHandler', {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'spec',
        entry: './services/appointment-api/src/handlers/swagger.ts',
        bundling: {
          ...bundlingConfig,
          commandHooks: {
            beforeBundling(inputDir: string, outputDir: string): string[] {
              // inputDir es la raíz del proyecto, el comando sigue siendo válido
              return [`cp ${inputDir}/services/appointment-api/openapi.yaml ${outputDir}`];
            },
            afterBundling(): string[] { return []; },
            beforeInstall() { return []; },
          }
        }
    });

    const swaggerUiHandler = new lambda_nodejs.NodejsFunction(this, 'SwaggerUiHandler', {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'ui',
        entry: './services/appointment-api/src/handlers/swagger.ts',
        bundling: bundlingConfig,
    });


    // --- Recurso: HTTP API (API Gateway v2) ---
    const httpApi = new apigwv2.HttpApi(this, 'AppointmentsHttpApi', {
      apiName: 'medical-appointments-api',
      description: 'API for creating and managing medical appointments',
    });

    // --- Integraciones y Rutas de la API ---
    httpApi.addRoutes({
      path: '/appointments',
      methods: [apigwv2.HttpMethod.POST],
      integration: new integrations.HttpLambdaIntegration('CreateAppointmentIntegration', appointmentHandler),
    });

    httpApi.addRoutes({
      path: '/appointments/{insuredId}',
      methods: [apigwv2.HttpMethod.GET],
      integration: new integrations.HttpLambdaIntegration('ListAppointmentsIntegration', appointmentHandler),
    });
    
    httpApi.addRoutes({
        path: '/appointments/{insuredId}/{appointmentId}',
        methods: [apigwv2.HttpMethod.GET],
        integration: new integrations.HttpLambdaIntegration('GetAppointmentIntegration', appointmentHandler),
    });

    // Rutas para la documentación
    httpApi.addRoutes({
        path: '/openapi.yaml',
        methods: [apigwv2.HttpMethod.GET],
        integration: new integrations.HttpLambdaIntegration('SwaggerSpecIntegration', swaggerSpecHandler),
    });
    
    httpApi.addRoutes({
        path: '/docs',
        methods: [apigwv2.HttpMethod.GET],
        integration: new integrations.HttpLambdaIntegration('SwaggerUiIntegration', swaggerUiHandler),
    });

    // --- Salida: URL de la API ---
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.url!,
      description: 'The URL of the API Gateway endpoint',
    });
  }
}