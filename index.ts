import express, {json, Router} from 'express';
import cors from 'cors';
import {config} from 'dotenv';

config();
import {authRouter} from "./routes/auth.router";
import {recipesRouter} from "./routes/recipes.router";
import {handleError} from "./utils/errors";
import {connectDB} from "./utils/db";

const PORT = process.env.PORT


const app = express();
const router = Router();

app.use(json());
app.use(cors());

router.use("/auth", authRouter);
router.use("/recipes", recipesRouter);

app.use('/api', router);

app.use(handleError);

(async () => {
    try {
        await connectDB();
        app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();



