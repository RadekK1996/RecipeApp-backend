import {Request, Response} from 'express';
import {createRecipe, getAllRecipes} from '../controllers/recipes.controller';
import {RecipeModel} from "../models/Recipes";
import {IRecipe} from "../types/recipe";

jest.mock('../models/Recipes');

describe('Recipes Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let mockRecipe: Partial<IRecipe>;

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
});
