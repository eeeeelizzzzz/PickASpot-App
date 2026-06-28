import { Router, type IRouter } from "express";
import healthRouter from "./health";
import restaurantsRouter from "./restaurants";

const router: IRouter = Router();

router.use(healthRouter);
router.use(restaurantsRouter);

export default router;
