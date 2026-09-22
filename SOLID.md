<div style="color: #000000;">

# Documentación — Principios SOLID y Docker

## 1. Aplicación de principios SOLID

El proyecto original (`server.ts` monolítico) mezclaba en un mismo archivo: definición del modelo, validaciones, cálculo del salario, acceso a la base de datos y manejo de errores HTTP. Esto generaba una clase con múltiples razones para cambiar y un fuerte acoplamiento entre la lógica de negocio y Mongoose/Express.

La refactorización separó el proyecto en 6 capas: `models`, `interface`, `repository`, `services`, `controllers`, `routes`, más un `errorHandler` centralizado.

### S — Single Responsibility Principle (Principio de responsabilidad única)

Cada clase tiene una única razón para cambiar:

| Clase | Responsabilidad única | Cambia si... |
| --- | --- | --- |
| `EmployeeRepository` | Ejecutar operaciones contra la base de datos (`create`, `findAll`, `findById`) | Cambia la tecnología de persistencia (ej: Mongo → PostgreSQL) |
| `EmployeeService` | Validar reglas de negocio y calcular el salario final | Cambia una regla de negocio (ej: el % de bonificación por antigüedad) |
| `EmployeeController` | Traducir entre HTTP (`req`/`res`) y el `service` | Cambia el protocolo de transporte o el formato de respuesta |
| `EmployeeRoutes` | Mapear URL + método HTTP → método del controller | Cambia el diseño de los endpoints |
| `ErrorHandler` | Representar un error de aplicación con su código HTTP asociado | Cambia la forma en que se comunican los errores |

Ejemplo concreto, en `EmployeeService.create()`:

```typescript
async create(data: EmployeeInterface) {
    // responsabilidad: validar
    if (!name || !position) throw ErrorHandler.BadRequest('Nombre y puesto son obligatorios');
    // ...

    // responsabilidad: calcular
    const bonus = baseSalary * 0.02 * yearsOfService;
    const finalSalary = baseSalary + bonus;

    // delega la persistencia, no la ejecuta él mismo
    return await this.repository.create({ ...data, finalSalary });
}
```

`EmployeeService` nunca importa `Employee` (el modelo de Mongoose) ni conoce `req`/`res`. Esa es la prueba de que su responsabilidad está acotada solo a las reglas de negocio.

### D — Dependency Inversion Principle (Inversión de dependencias)

Las clases de alto nivel (`EmployeeService`, `EmployeeController`) no crean sus propias dependencias con `new` internamente — las reciben inyectadas por constructor. Esto invierte la dirección de la dependencia: en vez de que `EmployeeService` dependa directamente de la implementación concreta de acceso a datos, depende de una referencia que le entregan desde afuera.

```typescript
// service/employee.service.ts
export class EmployeeService {
    constructor(private readonly repository: EmployeeRepository) {}
}

// controllers/employee.controller.ts
export class EmployeeController {
    constructor(private readonly service: EmployeeService) {}
}
```

La inyección real ocurre en un único lugar del proyecto — `routes/employee.routes.ts` — que actúa como punto de composición:

```typescript
const controller = new EmployeeController(new EmployeeService(new EmployeeRepository()));
```

Gracias a esto, si mañana se reemplaza `EmployeeRepository` por una versión que use otra base de datos (siempre que exponga los mismos métodos `create`/`findAll`/`findById`), ni `EmployeeService` ni `EmployeeController` necesitan modificarse.

### O — Open/Closed Principle (Abierto/cerrado)

El manejo de errores está diseñado para extenderse sin modificar código existente. `ErrorHandler` centraliza la creación de errores mediante métodos estáticos:

```typescript
export class ErrorHandler extends Error {
    constructor(public statusCode: number, public message: string) { super(message); }
    static BadRequest(message: string) { return new ErrorHandler(400, message); }
    static NotFound(message: string) { return new ErrorHandler(404, message); }
    static InternalServer(message: string) { return new ErrorHandler(500, message); }
}
```

Si el proyecto necesita un nuevo tipo de error (por ejemplo `Conflict` para un empleado duplicado), se agrega un método estático más a `ErrorHandler` sin tocar ni el `controller` ni el `service` que ya lo usan — el `handleErrors` del controller sigue funcionando igual porque solo depende de la forma del error (`statusCode` + `message`), no de qué método estático lo generó.

### L — Liskov Substitution Principle

`ErrorHandler extends Error`. Cualquier lugar del código (o de Node/Express) que espere recibir un `Error` — por ejemplo el manejo por defecto de excepciones no capturadas — puede recibir un `ErrorHandler` sin romperse, porque `ErrorHandler` respeta completamente el contrato de `Error` (tiene `.message`, `.stack`, y se comporta como un error real ante `throw`/`catch`). No se sobreescribe ni se restringe ningún comportamiento heredado de `Error`.

### I — Interface Segregation Principle

`EmployeeInterface` describe únicamente los datos propios de un empleado (`name`, `position`, `baseSalary`, `yearsOfService`, `finalSalary`) — no se mezcla con responsabilidades ajenas (como datos de autenticación o de otra entidad). Al ser una interfaz chica y específica, cualquier clase que dependa de ella (`EmployeeService`, `EmployeeRepository`, `EmployeeController`) solo se ve afectada si cambia algo que realmente le concierne a un empleado, y no por cambios en otras partes del dominio.

*Nota: este proyecto, al tener una sola entidad, no presenta un caso donde una interfaz grande obligue a implementar métodos no utilizados — el principio se cumple por diseño simple, más que por una refactorización activa contra una violación existente.*

---

## 2. Análisis del `docker-compose.yml`

```yaml
services:
  mongodb:
    image: mongo:8
    container_name: empleados-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### ¿Qué función cumple?

Este archivo no forma parte de la lógica de la aplicación ni del refactor SOLID — resuelve un problema de infraestructura: **levantar una base de datos MongoDB lista para usar, sin instalarla manualmente en el sistema operativo del equipo de desarrollo.**

### ¿Qué servicio configura?

Define un único servicio, `mongodb`, a partir de la imagen oficial `mongo:8` (MongoDB versión 8). Cuando se ejecuta `docker compose up -d`, Docker descarga esa imagen (si no la tiene) y levanta un contenedor a partir de ella, llamado `empleados-mongodb`.

- `restart: unless-stopped`: si el contenedor se cae (por ejemplo, tras reiniciar la máquina), Docker lo vuelve a levantar automáticamente, salvo que se lo haya detenido manualmente.
- `ports: "27017:27017"`: mapea el puerto 27017 del contenedor (el puerto por defecto en el que MongoDB escucha conexiones) al puerto 27017 de la máquina host. Gracias a este mapeo, una aplicación que corre fuera del contenedor (como el servidor Node/Express de este proyecto) puede conectarse a `localhost:27017` como si Mongo estuviera instalado directamente en el sistema.
- `volumes: mongo_data:/data/db`: monta un volumen llamado `mongo_data` en la ruta `/data/db` del contenedor, que es donde MongoDB guarda sus archivos de datos. Un volumen es un almacenamiento gestionado por Docker que persiste **fuera** del ciclo de vida del contenedor: si el contenedor se elimina y se vuelve a crear, los datos guardados en Mongo no se pierden, porque siguen existiendo en el volumen.

### ¿Cómo se relaciona con el funcionamiento general de la aplicación?

El servidor Node se conecta a esta base a través de la variable de entorno `MONGO_URI`, definida en `.env` (a partir de `.env.example`) y leída en `server.ts`:

```typescript
const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/employees_db';

mongoose.connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, ...);
  });
```

El flujo de arranque completo del proyecto es:

1. `docker compose up -d` → levanta el contenedor de MongoDB en segundo plano, escuchando en `localhost:27017`.
2. `npm install` → instala las dependencias de Node (Express, Mongoose, dotenv, etc.).
3. `npm run dev` → arranca el servidor, que ejecuta `mongoose.connect(MONGO_URI)` contra ese mismo puerto.
4. Recién cuando esa conexión se resuelve exitosamente, se ejecuta `app.listen(PORT, ...)` — el servidor no acepta pedidos HTTP hasta no tener la base de datos disponible.

A partir de ahí, cada operación que ejecuta `EmployeeRepository` (`Employee.create`, `Employee.find`, `Employee.findById`) viaja por esa conexión hacia el contenedor de Mongo, que persiste los datos en el volumen `mongo_data`.

En resumen: Docker Compose no forma parte del código de la aplicación, sino de su entorno de ejecución — garantiza que cualquier persona que clone el repositorio pueda tener una base de datos MongoDB funcionando de forma reproducible, con un solo comando, sin depender de una instalación local previa.

</div>
