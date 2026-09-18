import { Router } from "express";
import authentication from "../../src/middlewares/auth_middleware.js";
import {
  createAppointment,
  getAppointments,
 
} from "../controllers/appointment_controller.js";

const router = Router();

router.route("/post-appointment").post(authentication, createAppointment)   // POST /appointments
router.route("/get-appointments").get(authentication, getAppointments
)     // GET  /appointments

// GET  /appointments/:id

export default router;