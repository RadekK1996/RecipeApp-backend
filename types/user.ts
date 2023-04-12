import {Document} from "mongoose";
import {IRecipe} from "./recipe";

export interface IUser extends Document {
    username: string;
    password: string;
    savedRecipes: IRecipe["_id"][];
};
