import {Router} from "express";
import {loginUser, registerUser} from "../controllers/auth.controller";

export const authRouter = Router()
    .post('/register', registerUser)
    .post('/login', loginUser)
