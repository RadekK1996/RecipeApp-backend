import {Router} from "express";
import {deleteUser, loginUser, registerUser, verifyToken} from "../controllers/auth.controller";

export const authRouter = Router()
    .post('/register', registerUser)
    .post('/login', loginUser)
    .delete('/:userID', verifyToken, deleteUser)
