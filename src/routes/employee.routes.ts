import { Router } from "express";
import { EmployeeController } from "../controllers/employee.controller";
import { EmployeeService } from "../services/employee.service";
import { EmployeeRepository } from "../repository/employee.repository";

export class EmployeeRoutes {

    static get routes(): Router {

        const router = Router();

        // aca arma la cadena completa de inyección de dependencias e instanciamos todo
        // primero el repository, con eso arma el service, con eso arma el controller posteriormente
        const repository = new EmployeeRepository();
        const service = new EmployeeService(repository);
        const controller = new EmployeeController(service);

        router.post('/employees', controller.create);
        router.get('/employees', controller.findAll);
        router.get('/employees/:id', controller.findOne);

        return router;
    }
}
