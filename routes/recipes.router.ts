import {Router} from "express";
import {
    addRecipeToUser,
    createRecipe,
    deleteSavedRecipe,
    getAllRecipes,
    getRecipeById,
    getSavedRecipeIds,
    getSavedRecipes, getUserById
} from "../controllers/recipes.controller";
import {verifyToken} from "../controllers/auth.controller";

export const recipesRouter = Router()
    .get('/', getAllRecipes)
    .post('/', verifyToken, createRecipe)
    .put('/', verifyToken, addRecipeToUser)
    .get('/savedRecipes/ids/:userID', getSavedRecipeIds)
    .get('/savedRecipes/:userID', getSavedRecipes)
    .get('/:recipeID', getRecipeById)
    .get('/users/:userID', getUserById)
    .delete('/:userID/savedRecipes/:recipeID', deleteSavedRecipe)

