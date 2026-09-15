import { Router } from "express"

export class employeeRoutes {

    static get routes(): Router {

       const router = Router()

       router.post('/employees')
       router.get('/employees')
       router.get('/employees/:id')

    return router
}}