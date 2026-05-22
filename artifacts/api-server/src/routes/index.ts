import { Router, type IRouter } from "express";
import healthRouter from "./health";
import googleReviewsRouter from "./google-reviews";

const router: IRouter = Router();

router.use(healthRouter);
router.use(googleReviewsRouter);

export default router;
