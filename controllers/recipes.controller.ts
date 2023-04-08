import {NextFunction, Request, Response} from "express";
import { RecipeModel } from "../models/Recipes";
import { UserModel } from "../models/Users";
import {ValidationError} from "../utils/errors";
import {IRecipe} from "../types/recipe";
import {IUser} from "../types/user";

export const getAllRecipes = async (req: Request, res: Response): Promise<void> => {
    try {
        const response = await RecipeModel.find({});
        res.json(response);
    } catch (err) {
        res.json(err);
    }
};


export const createRecipe = async (req: Request, res: Response): Promise<void> => {
    try {
        const recipe: IRecipe = new RecipeModel(req.body);
        await recipe.validate();
        await recipe.save();
        res.json(recipe);
    } catch (err) {
        if (err.name === 'ValidationError') {
            res.status(400).json({ error: err.message });
        } else {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

export const addRecipeToUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const recipe: IRecipe = await RecipeModel.findById(req.body.recipeID);
        const user: IUser = await UserModel.findById(req.body.userID);
        user.savedRecipes.push(recipe);
        await user.save();
        res.json({ savedRecipes: user.savedRecipes });
    } catch (err) {
        res.status(500).json(err);
    }
};

export const getSavedRecipeIds = async (req: Request, res: Response): Promise<void> => {
    try {
        const user: IUser = await UserModel.findById(req.params.userID);
        res.json({ savedRecipes: user?.savedRecipes });
    } catch (err) {
        res.status(500).json(err);
    }
};

export const getSavedRecipes = async (req: Request, res: Response): Promise<void> => {
    try {
        const user: IUser = await UserModel.findById(req.params.userID);
        const savedRecipes = await RecipeModel.find({
            _id: { $in: user.savedRecipes },
        });
        res.json({ savedRecipes });
    } catch (err) {
        res.json(err);
    }
};

export const getRecipeById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const recipe: IRecipe = await RecipeModel.findById(req.params.recipeID);
        if (!recipe) {
           throw new ValidationError("Recipe not found.");
        }
        res.json(recipe);
    } catch (err) {
       next(err)
    }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user: IUser = await UserModel.findById(req.params.userID);
        if (!user) {
            throw new ValidationError("User not found.");
        }
        res.json({username: user.username});
    } catch (err) {
        next(err)
    }
};

export const deleteSavedRecipe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const recipe: IRecipe = await RecipeModel.findById(req.params.recipeID);
        if (!recipe) {
           throw new ValidationError("Recipe not found.");
        }
        const user: IUser = await UserModel.findById(req.params.userID);
        user.savedRecipes = user.savedRecipes.filter(
            (recipeID) => recipeID != req.params.recipeID
        );
        await user.save();
        res.json({ message: "Recipe has been deleted." });
    } catch (err) {
      next(err)
    }
};