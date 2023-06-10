import {Router} from "express";
import {
    addRecipeToUser,
    checkAdminStatus,
    createRecipe,
    deleteRecipeByAdmin,
    deleteSavedRecipe,
    getAllRecipes,
    getRecipeById,
    getSavedRecipeIds,
    getSavedRecipes,
    getUserById,
    searchRecipes
} from "../controllers/recipes.controller";
import {verifyToken} from "../controllers/auth.controller";

export const recipesRouter = Router()
    .get('/', getAllRecipes)
    .post('/', verifyToken, createRecipe)
    .put('/', verifyToken, addRecipeToUser)
    .get('/search', searchRecipes)
    .get('/savedRecipes/ids/:userID', getSavedRecipeIds)
    .get('/savedRecipes/:userID', getSavedRecipes)
    .get('/:recipeID', getRecipeById)
    .get('/users/:userID', getUserById)
    .delete('/:userID/savedRecipes/:recipeID', deleteSavedRecipe)
    .delete('/:recipeID', verifyToken, deleteRecipeByAdmin)
    .get(`/adminStatus/:userID`, checkAdminStatus);

