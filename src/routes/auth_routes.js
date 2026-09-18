import {Router} from "express";
import { signup, verifyotp, login ,resendotp, forgetPassword, confirmotp, changepassword, userlogout
, getUser,updateProfile,deleteAccount

} from "../controllers/auth_controller.js";
import authentication from "../../src/middlewares/auth_middleware.js";
const router = Router();
router.route("/signup").post(signup);
router.route("/verifyotp").post(authentication, verifyotp);
router.route('/login').post(login);
router.route('/resendotp').post(authentication, resendotp);
router.route('/forget-password').post(forgetPassword);
router.route("/confirm-otp").post(authentication, confirmotp);
router.route("/change-password").post(authentication, changepassword);
router.route('/logout').post(authentication, userlogout);
router.route('/user').get(authentication, getUser);
router.route('/update-profile').post(authentication, updateProfile);
router.route('/delete-account').post(authentication, deleteAccount);
export default router;