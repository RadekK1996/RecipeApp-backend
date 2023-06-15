import {Request as ExpressRequest, Response} from 'express';
import {RecipeModel} from "../models/Recipes";
import {IRecipe} from "../types/recipe";
import {DecodedUser, IUser} from "../types/user";
import {UserModel} from "../models/Users";
import {ValidationError} from "../utils/errors";
import {
    addRecipeToUser, checkAdminStatus,
    createRecipe, deleteRecipeByAdmin, deleteSavedRecipe, editRecipeByAdmin,
    getAllRecipes, getRecipeById,
    getSavedRecipeIds,
    getSavedRecipes, getUserById, searchRecipes
} from '../controllers/recipes.controller';


interface Request extends ExpressRequest {
    user?: DecodedUser;
}

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

    describe('searchRecipes', () => {
        beforeEach(() => {
            req = {
                query: {name: 'test'},
            };

            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
        });

        it('should return recipes that match the search term', async () => {
            mockRecipes = [{_id: '123', name: 'test recipe'}];

            (RecipeModel.find as jest.Mock).mockResolvedValue(mockRecipes);

            await searchRecipes(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith(mockRecipes);
        });

        it('should return an empty array when no recipes match the search term', async () => {
            (RecipeModel.find as jest.Mock).mockResolvedValue([]);

            await searchRecipes(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith([]);
        });

        it('should return a server error when the data base query fails', async () => {
            (RecipeModel.find as jest.Mock).mockRejectedValue(new Error('Database error'));

            await searchRecipes(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({error: 'Server error'});
        });

        it('should return an empty array when the search term is an empty string', async () => {
            req.query.name = '';
            mockRecipes = [];

            (RecipeModel.find as jest.Mock).mockResolvedValue(mockRecipes);

            await searchRecipes(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith(mockRecipes);
        });

        it('should return an empty array when the search term does not match any recipe names', async () => {
            req.query.name = 'nonexistent recipe name';
            mockRecipes = [];

            (RecipeModel.find as jest.Mock).mockResolvedValue(mockRecipes);

            await searchRecipes(req as Request, res as Response);

            expect(res.json).toHaveBeenCalledWith(mockRecipes);
        });
    });

    describe('checkAdminStatus', () => {
        beforeEach(() => {
            req = {
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

        it('should return the admin status of user', async () => {
            const mockUser = {_id: '123', isAdmin: true};

            (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

            await checkAdminStatus(req as Request, res as Response, next);


            expect(res.json).toHaveBeenCalledWith({isAdmin: mockUser.isAdmin});
        });

        it('should return an error if the user is not found', async () => {
            (UserModel.findById as jest.Mock).mockResolvedValue(null);

            await checkAdminStatus(req as Request, res as Response, next);


            expect(next).toHaveBeenCalledWith(new ValidationError("User not found."));
        });

        it('should return the error to next function if there is a database error', async () => {
            const error = new Error('Database error');
            (UserModel.findById as jest.Mock).mockRejectedValue(error);

            await checkAdminStatus(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(error);
        });

    });

    describe('deleteRecipeByAdmin', () => {
        beforeEach(() => {
            req = {
                user: {
                    isAdmin: true,
                    id: '123'
                },

                params: {
                    recipeID: '123'
                }
            };

            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            next = jest.fn();
        });

        it('should delete a recipe if the user is admin', async () => {
            const mockRecipe = [{_id: '123', name: 'test recipe'}];

            (RecipeModel.findById as jest.Mock).mockResolvedValue(mockRecipe);
            (RecipeModel.deleteOne as jest.Mock).mockResolvedValue({deletedCount: 1});

            await deleteRecipeByAdmin(req as Request & { user?: DecodedUser }, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({message: "Recipe has been deleted."});
        });

        it('should return an error if the user is not an admin', async () => {
            req.user.isAdmin = false;

            (RecipeModel.deleteOne as jest.Mock).mockResolvedValue({deletedCount: 1});

            await deleteRecipeByAdmin(req as Request & { user?: DecodedUser }, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({error: 'User is not admin'});
        });

        it('should return an error if the recipe is not found', async () => {
            (RecipeModel.findById as jest.Mock).mockResolvedValue(null);

            await deleteRecipeByAdmin(req as Request & { user?: DecodedUser }, res as Response, next);

            expect(next).toHaveBeenCalledWith(new ValidationError("Recipe not found."));
        });
        it('should pass the error to next function if there is a database error', async () => {
            const error = new Error('Database error');
            (RecipeModel.findById as jest.Mock).mockRejectedValue(error);

            await deleteRecipeByAdmin(req as Request & { user?: DecodedUser }, res as Response, next);

            expect(next).toHaveBeenCalledWith(error);
        });

    });

    describe('editRecipeByAdmin', () => {
        beforeEach(() => {
            req = {
                user: {
                    isAdmin: true,
                    id: '123'
                },

                params: {
                    recipeID: '123'
                },
                body: {
                    name: 'Updated recipe',
                    ingredients: ['ingredients1', 'ingredients2']
                }
            };

            res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };
            next = jest.fn();
        });

        it('should edit a recipe if the user is admin', async () => {
            const mockRecipe = {_id: '123', name: 'test recipe'};

            (RecipeModel.updateOne as jest.Mock).mockResolvedValue({nModified: 1});
            (RecipeModel.findById as jest.Mock).mockResolvedValue(mockRecipe);


            await editRecipeByAdmin(req as Request & { user?: DecodedUser }, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({message: "Recipe has been updated", recipe: mockRecipe});
        });

        it('should return an error if the user is not an admin', async () => {
            req.user.isAdmin = false;

            await editRecipeByAdmin(req as Request & { user?: DecodedUser }, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({error: 'User is not admin'});
        });

        it('should return an error if the recipe is not found', async () => {
            (RecipeModel.findById as jest.Mock).mockResolvedValue(null);

            await editRecipeByAdmin(req as Request & { user?: DecodedUser }, res as Response, next);

            expect(next).toHaveBeenCalledWith(new ValidationError("Updated recipe not found."));
        });

        it('should pass the error to next function if there is a database error', async () => {
            const error = new Error('Database error');
            (RecipeModel.updateOne as jest.Mock).mockRejectedValue(error);

            await editRecipeByAdmin(req as Request & { user?: DecodedUser }, res as Response, next);

            expect(next).toHaveBeenCalledWith(error);
        });

    });
});
