import mongoose, {model, Schema} from "mongoose";
import {IRecipe} from "../types/recipe";

const RecipeSchema = new Schema<IRecipe>({
   name: {
       type: String,
       required: true,
   },
    ingredients: [{type: String, required: true}],
    instructions: {type: String, required: true},
    imgUrl: {type: String, required: true},
    cookingTime: {type: Number, required: true},
    category: {type: String, required: true},
    createdAt: {type: Date, default: Date.now},
    userOwner:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true
        },


});

export const RecipeModel = model<IRecipe>("recipes", RecipeSchema);
