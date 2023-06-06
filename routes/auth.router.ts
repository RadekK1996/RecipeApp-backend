import {Router} from "express";
import {loginUser, registerAdmin, registerUser} from "../controllers/auth.controller";

export const authRouter = Router()
    .post('/register', registerUser)
    .post('/registerAdmin', registerAdmin)
    .post('/login', loginUser)
