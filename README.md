# test-medical-appointments


Nota sobre la Arquitectura del Servicio appointment-api
Decisión de Diseño: Lambda Monolítico vs. Funciones Especializadas
En el diseño del microservicio appointment-api, se tomó la decisión de implementar un único handler Lambda (appointmentHandler) para gestionar múltiples responsabilidades:

Creación de citas (a través de POST /appointments).

Listado de citas (a través de GET /appointments/{insuredId}).

Actualización de estado de citas (a través de un trigger de SQS).

Esta implementación se realizó para cumplir estrictamente con un diagrama de arquitectura predefinido para el proyecto.

Deuda Técnica y Trade-offs Asumidos
Es importante registrar que esta consolidación es una desviación deliberada de las mejores prácticas recomendadas para arquitecturas serverless, que favorecen funciones pequeñas, especializadas y con un propósito único. Al adoptar este enfoque de "Lambda monolítico", se asumen las siguientes contrapartidas y riesgos técnicos:

Violación del Principio de Responsabilidad Única (SRP): La función tiene múltiples razones para cambiar, lo que aumenta el riesgo de que una modificación en una funcionalidad (ej. listado) afecte inadvertidamente a otra (ej. creación).

Principio de Menor Privilegio Comprometido: El rol IAM asociado a esta función debe tener la suma de todos los permisos necesarios (escribir y leer en DynamoDB, publicar en SNS, consumir de SQS). Esto significa que endpoints que solo deberían leer datos (como el de listado) operan con permisos de escritura, lo cual representa una superficie de ataque de seguridad más amplia.

Complejidad Operacional: La configuración de recursos como el timeout y la asignación de memoria debe ajustarse para el caso de uso más exigente, lo que puede resultar en un sobreaprovisionamiento y costos más elevados para las operaciones más simples.

Mantenibilidad Reducida: El código del handler requiere una lógica de enrutamiento interna para diferenciar los tipos de eventos, lo que añade complejidad y dificulta las pruebas unitarias y la legibilidad a largo plazo.

Recomendación a Futuro
Se recomienda que, en futuras iteraciones del proyecto, se considere refactorizar este servicio para dividir el appointmentHandler en funciones Lambda separadas y especializadas. Este cambio alinearía el servicio con los principios de diseño serverless, mejorando su seguridad, mantenibilidad y eficiencia operativa.