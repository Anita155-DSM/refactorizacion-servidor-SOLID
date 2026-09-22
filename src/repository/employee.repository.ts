// repository separa la logica de negocio de la logica de acceso a datos
// estp cn la finalidad de facilitar el mantenimiento y pruebas unitarias
// tambien nos permite cmbiar la fuente de datos, osea, por ejemplo cambiar de mongo a mysql
import { Employee } from "../models/employee.model";
import { EmployeeInterface } from "../interface/employee";

export class EmployeeRepository {

    async create(data: EmployeeInterface) {
        return await Employee.create(data);
    }

    async findAll() {
        return await Employee.find().sort({ createdAt: -1 });
    }

    async findById(id: string) {
        return await Employee.findById(id);
    }
}
