import {Request, Response} from 'express';
import {RecipeModel} from "../models/Recipes";
import {IRecipe} from "../types/recipe";
import {IUser} from "../types/user";
import {UserModel} from "../models/Users";
import {ValidationError} from "../utils/errors";
import {
    addRecipeToUser,
    createRecipe, deleteSavedRecipe,
    getAllRecipes, getRecipeById,
    getSavedRecipeIds,
    getSavedRecipes, getUserById
} from '../controllers/recipes.controller';


jest.mock('../models/Recipes');
jest.mock('../models/Users');

describe('Recipes Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let mockRecipe: Partial<IRecipe>;
    let mockRecipes: Partial<IRecipe>[];
    let mockUser: Partial<IUser>
    let next: jest.Mock;

    beforeEach(() => {
        mockRecipe = new RecipeModel();

        req = {
            body: {title: 'Recipe Title', ingredients: ['Ingredient 1', 'Ingredient 2']},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllRecipes', () => {
        it('returns all recipes when database fetch is successful', async () => {
            const mockRecipes = [
                {id: 1, title: 'Recipe 1'},
                {id: 2, title: 'Recipe 2'},
            ];

            (RecipeModel.find as jest.Mock).mockResolvedValue(mockRecipes);

            await getAllRecipes({} as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith(mockRecipes);
        });

        it('returns an error when database fetch fails', async () => {
            const mockError = new Error('Database error');

            (RecipeModel.find as jest.Mock).mockRejectedValue(mockError);

            await getAllRecipes({} as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({error: 'Server error'});
        });
    });

    describe('createRecipe', () => {
        it('creates a new recipe when the request is valid', async () => {
            (RecipeModel as unknown as jest.Mock).mockReturnValue(mockRecipe);
            (mockRecipe.validate as jest.Mock).mockResolvedValue(undefined);
            (mockRecipe.save as jest.Mock).mockResolvedValue(undefined);

            await createRecipe(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith(mockRecipe);
        });

        it('returns a validation error when the request is invalid', async () => {
            const mockValidationError = {name: 'ValidationError', message: 'Validation Error'};

            (mockRecipe.validate as jest.Mock).mockRejectedValue(mockValidationError);

            await createRecipe(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({error: mockValidationError.message});
        });

        it('returns a server error when the save operation fails', async () => {
            const mockServerError = {name: 'ServerError', message: 'Server Error'};

            (mockRecipe.validate as jest.Mock).mockResolvedValue(undefined);
            (mockRecipe.save as jest.Mock).mockRejectedValue(mockServerError);

            await createRecipe(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({error: 'Server error'});
        });
    });

    describe('addRecipeToUser', () => {
        beforeEach(() => {
            mockRecipe = new RecipeModel();
            mockUser = new UserModel();
            mockUser.savedRecipes = [];

            req = {
                body: {recipeID: '1', userID: '1'},
            };

            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
        });

        it('adds a recipe to the user when the IDs are valid', async () => {
            (RecipeModel.findById as jest.Mock).mockResolvedValue(mockRecipe);
            (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
            (mockUser.save as jest.Mock).mockResolvedValue(undefined);

            await addRecipeToUser(req as Request, res as Response);

            expect(mockUser.savedRecipes).toContain(mockRecipe);
            expect(res.json).toHaveBeenCalledWith({savedRecipes: mockUser.savedRecipes});
        });

        it('returns a server error when the RecipeModel fetch fails', async () => {
            const mockError = new Error('Database error');

            (RecipeModel.findById as jest.Mock).mockRejectedValue(mockError);

            await addRecipeToUser(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(mockError);
        });

        it('returns a server error when the UserModel fetch fails', async () => {
            const mockError = new Error('Database error');

            (UserModel.findById as jest.Mock).mockRejectedValue(mockError);

            await addRecipeToUser(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(mockError);
        });


        it('returns a server error when the save operation fails', async () => {
            const serverError = new Error('ServerError');

            (RecipeModel.findById as jest.Mock).mockResolvedValue(mockRecipe);
            (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
            (mockUser.save as jest.Mock).mockRejectedValue(serverError);

            await addRecipeToUser(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(serverError);
        });

        it('returns an error when no recipe is found with provided ID', async () => {

            (RecipeModel.findById as jest.Mock).mockResolvedValue(null);

            await addRecipeToUser(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({error: 'No recipe found with the provided ID.'});
        });
    });

    describe('getSavedRecipeIds', () => {
        beforeEach(() => {
            mockUser = {
                _id: '123',
                savedRecipes: ['456', '789']
            };

            req = {
                params: {userID: '123'},
            };

            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
        });

        it('returns saved recipe ids when the user is found', async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

            await getSavedRecipeIds(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({savedRecipes: mockUser.savedRecipes});
        });

        it('returns an error when the user is not found', async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(null);

            await getSavedRecipeIds(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({error: 'User not found'});
        });
    });

    describe('getSavedRecipes', () => {
        beforeEach(() => {
            mockUser = {
                _id: '123',
                savedRecipes: ['456', '789']
            };

            mockRecipes = [
                {_id: '456', name: 'Recipe 1'},
                {_id: '789', name: 'Recipe 2'}
            ];

            req = {
                params: {userID: '123'},
            };

            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
        });

        it('returns saved recipes when the user is found', async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
            (RecipeModel.find as jest.Mock).mockResolvedValue(mockRecipes);

            await getSavedRecipes(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith({savedRecipes: mockRecipes});


        });

        it('returns an error when the user is not found', async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(null);

            await getSavedRecipes(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({error: 'User not found'});

        });
    });

    describe('getRecipeById', () => {
        beforeEach(() => {
            mockRecipe = {_id: '456', name: 'Recipe 1'};

            req = {
                params: {recipeID: '456'},
            };

            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            next = jest.fn();
        });

        it('should return the recipe matching the provided id', async () => {

            (RecipeModel.findById as jest.Mock).mockResolvedValue(mockRecipe);

            await getRecipeById(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith(mockRecipe);
        });

        it('should throw a ValidationError when no recipe matches the provided id', async () => {
            (RecipeModel.findById as jest.Mock).mockResolvedValue(null);

            await getRecipeById(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(new ValidationError('Recipe not found.'));
        });
    });

    describe('getUserById', () => {
        beforeEach(() => {
            mockUser = {
                _id: '123',
                savedRecipes: ['456', '789'],
                username: 'testowy'
            };

            req = {
                params: {userID: '123'},
            };

            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            next = jest.fn();
        });

        it('should return the user matching the provided id', async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

            await getUserById(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({username: mockUser.username});
        });

        it('should throw a ValidationError when no user matches the provided id', async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(null);

            await getUserById(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(new ValidationError('User not found.'));
        });
    });

    describe('deleteSavedRecipe', () => {
        beforeEach(() => {
            mockUser = {
                _id: '123',
                savedRecipes: ['456', '789'],
                username: 'testowy',
                save: jest.fn().mockResolvedValue(this)
            };

            mockRecipe = {_id: '456', name: 'Recipe 1'};

            req = {
                params: {userID: '123', recipeID: '456'},
            };

            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            next = jest.fn();
        });

        it('should delete the recipe from the user\'s saved recipes', async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
            (RecipeModel.findById as jest.Mock).mockResolvedValue(mockRecipe);

            await deleteSavedRecipe(req as Request, res as Response, next);

            expect(mockUser.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({message: "Recipe has been deleted."});
        });

        it('should throw a ValidationError when no recipe matches the provided id', async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
            (RecipeModel.findById as jest.Mock).mockResolvedValue(null);

            await deleteSavedRecipe(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(new ValidationError('Recipe not found.'));
        });

        it('should throw a ValidationError when no user matches the provided id', async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(null);
            (RecipeModel.findById as jest.Mock).mockResolvedValue(mockRecipe);

            await deleteSavedRecipe(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(new ValidationError('User not found.'));
        });
    });
});

