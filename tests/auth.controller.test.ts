import {NextFunction, Request as ExpressRequest, Response} from 'express';
import bcrypt from "bcrypt";
import {UserModel} from "../models/Users";
import {deleteUser, loginUser, registerUser} from "../controllers/auth.controller";
import {DecodedUser, IUser} from "../types/user";
import {ValidationError} from "../utils/errors";
import jwt from "jsonwebtoken";


interface Request extends ExpressRequest {
    user?: DecodedUser;
}

jest.mock('../models/Users');

jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
}));

describe('Auth Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let mockUser: Partial<IUser>
    let next: jest.Mock

    beforeEach(() => {
        mockUser = new UserModel();
        req = {
            body: {username: 'TestUser', password: 'TestPass1'},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('registerUser', () => {
        it('registers a user when username is unique and password is valid', async () => {
            (UserModel.findOne as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
            (mockUser.save as jest.Mock).mockResolvedValue(undefined);

            await registerUser(req as Request, res as Response, next as NextFunction);

            expect(res.json).toHaveBeenCalledWith({message: "User Registered Successfully."});

        });

        it('throws a validation error when password is invalid', async () => {
            req.body.password = 'Wrong password'

            await registerUser(req as Request, res as Response, next as NextFunction);

            expect(next).toHaveBeenCalledWith(new ValidationError("Password must contain at least one digit, one lowercase, one uppercase letter, and be at least 5 characters long."));
        });

        it('throws a validation error when user already exist', async () => {
            (UserModel.findOne as jest.Mock).mockResolvedValue(mockUser);

            await registerUser(req as Request, res as Response, next as NextFunction);

            expect(next).toHaveBeenCalledWith(new ValidationError("User already exists!"));
        });

        it('throws an error when hashing fails', async () => {
            const error = new Error('Hashing error');
            (UserModel.findOne as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockRejectedValue(error);

            await registerUser(req as Request, res as Response, next as NextFunction);

            expect(next).toHaveBeenCalledWith(error);
        });

        it('throws an error when saving the user fails', async () => {
            const error = new Error('Save error');
            (UserModel.findOne as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
            (mockUser.save as jest.Mock).mockRejectedValue(error);

            await registerUser(req as Request, res as Response, next as NextFunction);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('loginUser', () => {
        beforeEach(() => {
            req = {
                body: {username: 'TestUser', password: 'TestPass1'},
            };

            res = {
                json: jest.fn(),
            };

            next = jest.fn();
        });

        it('logs in a user when username exists and password is valid', async () => {
            (UserModel.findOne as jest.Mock).mockResolvedValue({
                password: 'hashedPassword',
                _id: 'userId'
            });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue('token');

            await loginUser(req as Request, res as Response, next as NextFunction);

            expect(res.json).toHaveBeenCalledWith({token: 'token', userID: 'userId'});
        });

        it('throws an error when username does not exist', async () => {
            (UserModel.findOne as jest.Mock).mockResolvedValue(null);

            await loginUser(req as Request, res as Response, next as NextFunction);

            expect(next).toHaveBeenCalledWith(new ValidationError('Username or Password is incorrect!'));
        });

        it('throws an error when password is invalid', async () => {
            (UserModel.findOne as jest.Mock).mockResolvedValue({password: 'hashedPassword'});
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await loginUser(req as Request, res as Response, next as NextFunction);

            expect(next).toHaveBeenCalledWith(new ValidationError("Username or Password is incorrect!"));
        });
    });

    describe('deleteUser', () => {
        beforeEach(() => {
            req = {
                user: {
                    isAdmin: false,
                    id: '123'
                },

                params: {
                    userID: '123'
                }
            };

            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            next = jest.fn();
        });

        it('should delete the user from database', async () => {
            const mockUser = [{_id: '123', name: 'testUser'}];
            (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
            (UserModel.findByIdAndRemove as jest.Mock).mockResolvedValue(mockUser)

            await deleteUser(req as Request & { user?: DecodedUser }, res as Response, next);

            expect(UserModel.findById).toHaveBeenCalledWith(req.user?.id);
            expect(UserModel.findByIdAndRemove).toHaveBeenCalledWith(req.user?.id);
            expect(res.json).toHaveBeenCalledWith({message: "User deleted successfully."});
        });

        it('throws an error when user is not found', async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(null);

            await deleteUser(req as Request & { user?: DecodedUser }, res as Response, next);

            expect(UserModel.findById).toHaveBeenCalledWith(req.user?.id);
            expect(next).toHaveBeenCalledWith(new ValidationError("User not found."));


        });

        it('throws an error when token is invalid', async () => {
            req.user = undefined;

            await deleteUser(req as Request & { user?: DecodedUser }, res as Response, next);

            expect(next).toHaveBeenCalledWith(new ValidationError("Invalid token."));

        });

        it('should handle database errors when finding user', async () => {
            const error = new Error('Database error');
            (UserModel.findById as jest.Mock).mockRejectedValue(error);

            await deleteUser(req as Request & { user?: DecodedUser }, res as Response, next);

            expect(UserModel.findById).toHaveBeenCalledWith(req.user?.id);
            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
