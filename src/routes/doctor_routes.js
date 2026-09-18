import {Router} from "express";
import { getDoctors
} from "../controllers/doctor_controller.js";

const router = Router();
router.route("/get-doctors").get(getDoctors);

export default router;