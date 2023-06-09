import {NextFunction, Request, Response} from "express";
import {UserModel} from "../models/Users";
import {ValidationError} from "../utils/errors";
import {validatePassword} from "../utils/passwordValidator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {config} from "dotenv";
import {DecodedUser, IUser} from "../types/user";

config();
const jwtSecret = process.env.JWT_SECRET;


export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const {username, password} = req.body;
        const user = await UserModel.findOne({username});

        if (user) {
            throw new ValidationError("User already exists!");
        }

        if (!validatePassword(password)) {
            throw new ValidationError("Password must contain at least one digit, one lowercase, one uppercase letter, and be at least 5 characters long.");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser: IUser = new UserModel({username, password: hashedPassword});
        await newUser.save();
        res.json({message: "User Registered Successfully."});
    } catch (err) {
        next(err)

    }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const {username, password} = req.body;
        const user: IUser = await UserModel.findOne({username});

        if (!user) {
            throw new ValidationError("Username or Password is incorrect!");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new ValidationError("Username or Password is incorrect!");
        }

        const token = jwt.sign({id: user._id, isAdmin: user.isAdmin}, jwtSecret);
        res.json({token, userID: user._id});
    } catch (err) {
        next(err);
    }
};

export const verifyToken = (req: Request & {user?: DecodedUser}, res: Response, next: NextFunction): void => {
    const token: string | undefined = req.headers.authorization;
    if (token) {
        jwt.verify(token, jwtSecret, (err: jwt.VerifyErrors | null, user: DecodedUser) => {
            if (err) return res.sendStatus(403);

            req.user = user;
            next();
        })
    } else {
        res.sendStatus(401);
    }
};
