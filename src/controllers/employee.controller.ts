import { Request, Response } from "express";
import { EmployeeService } from "../services/employee.service";

//controller recibe req,res, no valida ni calcula ya que eso lo hace service, lo que hacemos nosotros es pasarle los datos a service
export class EmployeeController {
    constructor(private readonly service: EmployeeService) { } //inyeccion de dependencias, no creamos un service, lo traemos de afuera que vendria siendo nuestro employeeService
    //segun lo que el service devuelva o tire como error, arma una respuesta http correcta
    handleErrors(error: any, res: Response) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        return res.status(500).json({ message: 'Error interno del servidor' });
    }

    create = async (req: Request, res: Response) => {
        try {
            const employee = await this.service.create(req.body);
            res.status(201).json(employee);
        } catch (error) {
            this.handleErrors(error, res);
        }
    };

    findAll = async (req: Request, res: Response) => {
        try {
            const employees = await this.service.findAll();
            res.status(200).json(employees);
        } catch (error) {
            this.handleErrors(error, res);
        }
    };
    findOne = async (req: Request<{ id: string }>, res: Response) => {
        try {
            const employee = await this.service.findById(req.params.id);
            res.status(200).json(employee);
        } catch (error) {
            this.handleErrors(error, res);
        }
    };
}