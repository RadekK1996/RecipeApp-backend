import {Request, Response} from 'express';
import { getAllRecipes} from '../controllers/recipes.controller';
import {RecipeModel} from "../models/Recipes";

jest.mock('../models/Recipes');

describe('Recipes Controller', () => {
    let req: Request;
    let res: Response;

    beforeEach(() => {
        req = {
            body: {title: 'Recipe Title', ingredients: ['Ingredient 1', 'Ingredient 2']},
        } as Request;
        res = {} as Response;
        res.status = jest.fn().mockReturnThis();
        res.json = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return all recipes', async () => {
        const mockRecipes = [
            {id: 1, title: 'Recipe 1'},
            {id: 2, title: 'Recipe 2'},
        ];

        (RecipeModel.find as jest.Mock).mockResolvedValue(mockRecipes);

        await getAllRecipes(req, res);

        expect(res.json).toHaveBeenCalledWith(mockRecipes);
    });

    it('should handle error when finding recipes', async () => {
        const mockError = new Error('Database error');

        (RecipeModel.find as jest.Mock).mockRejectedValue(mockError);

        await getAllRecipes(req, res);

        expect(res.json).toHaveBeenCalledWith(mockError);
    });


});
