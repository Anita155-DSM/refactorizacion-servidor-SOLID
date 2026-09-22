import { EmployeeRepository } from "../repository/employee.repository"; 
import { EmployeeInterface } from "../interface/employee";
import { ErrorHandler } from "../errorHandler/errorHandler";

//en service cada metodo hace una sola cosa, validan reglas de megocio y calculan, nunca abrimos un try/catch ya que eso lo trabajamos en el controller, solo hablamos con repository
export class EmployeeService {
    constructor(private readonly repository: EmployeeRepository) {} //el service no crea su propio EmployeeRepository con new adentro, se lo pasan de afuera, esto es justamente inyección de dependencias
//con service nosotros validamos como es un empleado válido y como se calcula su sueldo
//en service a diferencia de repository, service solo cambia si cambia una regla de negocio, y en repository si el dia de mañana cambiamos de mongoose a postgresql por ej
    async create(data: EmployeeInterface) {
        const { name, position, baseSalary, yearsOfService } = data;
        //regla de negocio, estamos validando
        if (!name || !position) {
            throw ErrorHandler.BadRequest('Nombre y puesto son obligatorios');
        }

        if (typeof baseSalary !== 'number' || baseSalary <= 0) {
            throw ErrorHandler.BadRequest('El salario base debe ser mayor a 0');
        }

        if (
            typeof yearsOfService !== 'number' ||
            yearsOfService < 0 ||
            !Number.isInteger(yearsOfService)
        ) {
            throw ErrorHandler.BadRequest('La antigüedad debe ser un entero mayor o igual a 0');
        }
        //regla de negocio, calcula el bonus y el salario final
        const bonus = baseSalary * 0.02 * yearsOfService;
        const finalSalary = baseSalary + bonus;

        //y aca, lo que hacemos es invocar a repository, aca lo usamos
        return await this.repository.create({ ...data, finalSalary });
    }

    async findAll() {
        return await this.repository.findAll();
    }

    async findById(id: string) {
        const employee = await this.repository.findById(id);
        if (!employee) {
            throw ErrorHandler.NotFound('Empleado no encontrado');
        }
        return employee;
    }
}