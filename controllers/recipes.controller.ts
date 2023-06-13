import {NextFunction, Request, Response} from "express";
import {RecipeModel} from "../models/Recipes";
import {UserModel} from "../models/Users";
import {ValidationError} from "../utils/errors";
import {IRecipe} from "../types/recipe";
import {DecodedUser, IUser} from "../types/user";

export const getAllRecipes = async (req: Request, res: Response): Promise<void> => {
    try {
        const response = await RecipeModel.find({});
        res.json(response);
    } catch (err) {
        res.status(500).json({error: 'Server error'});
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
            res.status(400).json({error: err.message});
        } else {
            console.error(err);
            res.status(500).json({error: 'Server error'});
        }
    }
};

export const addRecipeToUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const recipe: IRecipe | null = await RecipeModel.findById(req.body.recipeID);
        const user: IUser = await UserModel.findById(req.body.userID);

        if (!recipe) {
            res.status(404).json({error: 'No recipe found with the provided ID.'});
        }
        user.savedRecipes.push(recipe);
        await user.save();
        res.json({savedRecipes: user.savedRecipes});
    } catch (err) {
        res.status(500).json(err);
    }
};

export const getSavedRecipeIds = async (req: Request, res: Response): Promise<void> => {
    try {
        const user: IUser = await UserModel.findById(req.params.userID);
        if (!user) {
            res.status(404).json({error: 'User not found'});
        } else {
            res.json({savedRecipes: user.savedRecipes});
        }
    } catch (err) {
        res.status(500).json({error: 'Server error'});
    }
};

export const getSavedRecipes = async (req: Request, res: Response): Promise<void> => {
    try {
        const user: IUser = await UserModel.findById(req.params.userID);
        if (!user) {
            res.status(404).json({error: 'User not found'});
        } else {
            const savedRecipes = await RecipeModel.find({
                _id: {$in: user.savedRecipes},
            });
            res.json({savedRecipes});
        }
    } catch (err) {
        res.status(500).json({error: 'Server error'});
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
        if (!user) {
            throw new ValidationError("User not found.");
        }
        user.savedRecipes = user.savedRecipes.filter(
            (recipeID) => recipeID != req.params.recipeID
        );
        await user.save();
        res.json({message: "Recipe has been deleted."});
    } catch (err) {
        next(err)
    }
};

export const searchRecipes = async (req: Request, res: Response): Promise<void> => {
    try {
        const {name} = req.query;
        let filter = {};

        if (typeof name === 'string') {
            filter = {...filter, name: new RegExp(name, 'i')};
        }

        const recipes = await RecipeModel.find(filter);
        res.json(recipes);

    } catch (e) {
        res.status(500).json({error: 'Server error'});
    }
};

export const deleteRecipeByAdmin = async (req: Request & { user?: DecodedUser }, res: Response, next: NextFunction): Promise<void> => {
    try {

        if (!req.user || !req.user.isAdmin) {
            res.status(403).json({error: 'User is not admin'});
            return;
        }

        const recipe: IRecipe | null = await RecipeModel.findById(req.params.recipeID);
        if (!recipe) {
            throw new ValidationError("Recipe not found.");
        }


        await RecipeModel.deleteOne({_id: req.params.recipeID});
        res.json({message: "Recipe has been deleted."});
    } catch (err) {
        next(err)
    }
};

export const editRecipeByAdmin = async (req: Request & { user?: DecodedUser }, res: Response, next: NextFunction): Promise<void> => {
    try {

        if (!req.user || !req.user.isAdmin) {
            res.status(403).json({error: 'User is not admin'});
            return;
        }

        const recipeData = req.body;

        await RecipeModel.updateOne({ _id: req.params.recipeID }, { $set: recipeData });

        const updatedRecipe : IRecipe | null = await RecipeModel.findById(req.params.recipeID);
        console.log('Recipe data after update: ', updatedRecipe);

        if(!updatedRecipe) {
            throw new ValidationError('Updated recipe not found.');
        }
        res.json({message: "Recipe has been updated", recipe: updatedRecipe});

    } catch (err) {
        next(err);
    }
};


export const checkAdminStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const {userID} = req.params;
        const user = await UserModel.findById(userID);

        if (!user) {
            throw new ValidationError("User not found.");
        }

        res.json({isAdmin: user.isAdmin});
    } catch (err) {
        next(err);
    }
};
