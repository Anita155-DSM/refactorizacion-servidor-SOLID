//esto es para el manejo de errores

export class ErrorHandler extends Error { //es como que le decimos que nuestra clase es un tipo especial de "Error" que viene por defecto por javascript + lo que nosotros le agregamos
    constructor(
        public statusCode: number, // lo agregamos porque nos interesa saber qué tipo de código HTTP devuelve, como por ej 400, 404, etc
        public message: string
    ) {
        super(message);
    }

    static BadRequest(message: string) {
        return new ErrorHandler(400, message);
    }

    static NotFound(message: string) {
        return new ErrorHandler(404, message);
    }

    static InternalServer(message: string) {
        return new ErrorHandler(500, message);
    }
}
