import mongoose, {model, Schema} from "mongoose";
import {IUser} from "../types/user";

const UserSchema = new Schema<IUser>({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    isAdmin: {type: Boolean, default: false},
    savedRecipes: [{type: mongoose.Schema.Types.ObjectId, ref: "recipes"}]
});


export const UserModel = model<IUser>("users", UserSchema);
