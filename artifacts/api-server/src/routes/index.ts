import { Router, type IRouter } from "express";
import healthRouter from "./health";
import googleReviewsRouter from "./google-reviews";
import contentRouter from "./content";
import adminRouter from "./admin";
import storageRouter from "./storage";
import setupRouter from "./setup";

const router: IRouter = Router();

router.use(setupRouter);
router.use(healthRouter);
router.use(googleReviewsRouter);
router.use(contentRouter);
router.use(adminRouter);
router.use(storageRouter);

export default router;
