import mongoose, { Schema, model } from "mongoose";
import { EmployeeInterface } from "../interface/employee";

//movimos lo que nos brindaba server.ts aqui
const employeeSchema =  new Schema<EmployeeInterface>(
    {
    name: { 
        type: String, 
        required: true },
    position: { 
        type: String, 
        required: true },
    baseSalary: { 
        type: Number, 
        required: true },
    yearsOfService: { 
        type: Number, 
        required: true },
    finalSalary: { 
        type: Number, 
        required: true }
    },
    {
        timestamps: true
    }
)

export const Employee = model<EmployeeInterface>('Employee', employeeSchema); //definimos el modelo que nos va a permitir trabajar con create, etc