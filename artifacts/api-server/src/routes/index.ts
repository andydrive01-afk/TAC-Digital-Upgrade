import { Router, type IRouter } from "express";
import healthRouter from "./health";
import googleReviewsRouter from "./google-reviews";
import contentRouter from "./content";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(googleReviewsRouter);
router.use(contentRouter);
router.use(adminRouter);

export default router;
