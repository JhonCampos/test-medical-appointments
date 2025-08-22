# Proyecto de Prueba para Agendamiento de Citas Médicas

Este repositorio contiene un proyecto de prueba que implementa un sistema de agendamiento de citas médicas utilizando una arquitectura serverless en AWS. El sistema está diseñado como un monorepo para facilitar la evaluación y demostración de habilidades técnicas.

## Resumen de Funcionalidades

El proyecto ofrece las siguientes capacidades principales:

1.  **Creación de Citas**: Expone un endpoint API (`POST /appointments`) para que los usuarios puedan solicitar una nueva cita médica.
2.  **Listado de Citas**: Proporciona un endpoint (`GET /appointments/{insuredId}`) para consultar todas las citas asociadas a un ID de asegurado.
3.  **Procesamiento Asíncrono por País**: Al crear una cita, se publica un evento en un tópico de SNS. Este evento es filtrado y encolado en colas SQS específicas según el país (`PE` para Perú, `CL` para Chile).
4.  **Procesadores de Citas**: Lambdas especializadas (`processPE` y `processCL`) consumen los mensajes de sus respectivas colas SQS para procesar la cita.
5.  **Actualización de Estado**: Una vez que una cita es procesada, se emite un evento a EventBridge, que a su vez encola un mensaje en una cola SQS de "completados". Un handler en la API principal consume este mensaje para actualizar el estado de la cita en la base de datos.

## Guía de Uso y Despliegue

### Prerrequisitos

-   Node.js (v20.x o superior)
-   PNPM (manejador de paquetes)
-   Serverless Framework (`npm install -g serverless`)
-   AWS CLI con credenciales configuradas en su entorno.

### Instalación Local

Clone el repositorio y ejecute el siguiente comando para instalar todas las dependencias del monorepo:

```bash
pnpm install
```

### Ejecución de Pruebas

Para correr las pruebas unitarias y de integración definidas en el proyecto, utilice:

```bash
pnpm test
```

### Modo Offline (Desarrollo Local)

Puede simular el entorno de AWS (API Gateway, Lambda, DynamoDB) en su máquina local. Para iniciar el servicio de API en modo offline, ejecute:

```bash
pnpm run offline:api
```

Esto levantará un servidor local. Los endpoints de la API estarán disponibles en `http://localhost:3000`.

### Gestión de la Documentación (OpenAPI)

El proyecto incluye un script para generar una especificación OpenAPI (`openapi.yaml`) a partir del lo que esté definido en el archivo ./scripts/generate-openapi.ts.

-   **Para generar el archivo `openapi.yaml`**, ejecute:
    ```bash
    pnpm run docs:generate
    ```

### Acceso a la Documentación

Una vez que la API está desplegada, puedes acceder a la documentación interactiva y a la especificación OpenAPI a través de los siguientes endpoints:

-   **Swagger UI (Interfaz Interactiva)**: `https://<URL_BASE_DE_LA_API>/docs`
-   **Especificación OpenAPI (YAML)**: `https://<URL_BASE_DE_LA_API>/openapi.yaml`

Sustituye `<URL_BASE_DE_LA_API>` por la URL que recibiste por correo.

### Endpoints Disponibles

A continuación se detallan las rutas disponibles en la API:

| Método | Ruta                                                                      |
|--------|---------------------------------------------------------------------------|
| POST   | `http://localhost:3000/appointments`                                      |
| POST   | `http://localhost:3000/2015-03-31/functions/appointmentHandler/invocations` |
| GET    | `http://localhost:3000/appointments/{insuredId}`                          |
| POST   | `http://localhost:3000/2015-03-31/functions/appointmentHandler/invocations` |
| GET    | `http://localhost:3000/appointments/{insuredId}/{appointmentId}`          |
| POST   | `http://localhost:3000/2015-03-31/functions/appointmentHandler/invocations` |
| GET    | `http://localhost:3000/docs`                                              |
| POST   | `http://localhost:3000/2015-03-31/functions/swagger/invocations`          |
| GET    | `http://localhost:3000/docs/{proxy*}`                                     |
| POST   | `http://localhost:3000/2015-03-31/functions/swagger/invocations`          |
| GET    | `http://localhost:3000/openapi.yaml`                                      |


### Despliegue en AWS

El proyecto se compone de dos servicios que deben desplegarse de forma independiente.

1.  **Desplegar la API de Citas**:
    ```bash
    pnpm run deploy:api
    ```

2.  **Desplegar los Procesadores de Citas**:
    ```bash
    pnpm run deploy:processor
    ```

Estos comandos utilizarán las credenciales de AWS configuradas en su entorno para provisionar toda la infraestructura necesaria a través de CloudFormation.

## Pruebas de Endpoints con cURL

Para verificar que la API desplegada funciona correctamente, puedes utilizar el script `scripts/test-api.sh`. Este script realiza una serie de peticiones cURL a los endpoints principales.

**Uso:**

```bash
./scripts/test-api.sh <URL_BASE_DE_LA_API>
```

**Importante:** La `<URL_BASE_DE_LA_API>` es la URL raíz de la API desplegada en AWS. Esta URL te será enviada por correo electrónico una vez que la infraestructura esté lista.

## Estructura del Proyecto (Monorepo)

El código está organizado en los siguientes paquetes y servicios:

-   `packages/`: Contiene la lógica de negocio y las implementaciones de infraestructura, separadas de los servicios desplegables.
    -   `core/`: Representa el corazón de la aplicación. Define las entidades de dominio (ej. `Appointment`), los casos de uso (ej. `CreateAppointment`), y los puertos (interfaces) para las dependencias externas como repositorios y publicadores de eventos. Es agnóstico a la tecnología.
    -   `infrastructure/`: Implementa los puertos definidos en `core`. Contiene la lógica para interactuar con servicios externos, como el repositorio de `DynamoDB` y los publicadores de eventos para `SNS` y `EventBridge`.

-   `services/`: Contiene los microservicios desplegables utilizando el Serverless Framework.
    -   `appointment-api/`: El servicio principal que expone la API REST pública a través de AWS API Gateway y AWS Lambda. Gestiona la creación, el listado y la actualización de estado de las citas.
    -   `appointment-processor/`: Contiene los workers asíncronos (Lambdas) que se encargan de procesar las citas recibidas desde las colas SQS.

## Infraestructura

La solución está construida sobre los siguientes servicios de AWS, orquestados a través del **Serverless Framework**:

-   **AWS Lambda**: Para la ejecución del código de la API y los procesadores de eventos.
-   **Amazon API Gateway**: Para exponer los endpoints HTTP de la API de citas.
-   **Amazon DynamoDB**: Como base de datos NoSQL para persistir la información de las citas.
-   **Amazon SNS (Simple Notification Service)**: Para la publicación de eventos de creación de citas y la distribución (fan-out) a múltiples suscriptores.
-   **Amazon SQS (Simple Queue Service)**: Para el encolamiento de mensajes, desacoplando la creación de la cita de su procesamiento y garantizando la entrega.
-   **Amazon EventBridge**: Para un bus de eventos más avanzado que gestiona la comunicación entre los procesadores y el servicio de API para la actualización de estado.

## Consideraciones Importantes

Es fundamental tener en cuenta los siguientes puntos al evaluar este proyecto:

> - **Esquema de Monorepo**: Este proyecto se ha estructurado como un monorepo para facilitar la prueba y la evaluación en un único repositorio. En un entorno de producción con un equipo de desarrollo más grande, es probable que los servicios (`appointment-api`, `appointment-processor`) y los paquetes (`core`, `infrastructure`) residan en repositorios separados para mejorar la autonomía de los equipos y la independencia de los despliegues.
>
> - **Prueba de Concepto**: Se debe entender que este proyecto es una prueba diseñada para corroborar los conocimientos técnicos requeridos para un rol específico. **No debe tomarse como base para una implementación en producción**, ya que carece de varios componentes críticos.
>
> - **Omisiones Deliberadas**: Para mantener el enfoque en la lógica de negocio principal, se han omitido intencionadamente los siguientes aspectos:
>    - **Seguridad y Autenticación**: No hay mecanismos de autenticación de usuarios ni autorización de endpoints.
>    - **CI/CD**: No se ha implementado un pipeline de integración y despliegue continuo. Los despliegues se realizan manualmente a través de los comandos del Serverless Framework.
>    - **Monitoreo y Alarmas**: Carece de un sistema robusto de monitoreo de errores, observabilidad y alarmas proactivas.