import mongoose, {Document} from "mongoose";

export interface IRecipe extends Document {
    name: string;
    ingredients: string[];
    instructions: string;
    imgUrl: string;
    cookingTime: number;
    category: string;
    createdAt: Date;
    userOwner: mongoose.Schema.Types.ObjectId;
};
