import { Router } from "express";
import authentication from "../../src/middlewares/auth_middleware.js";
import {
  getConversations,
  getMessages,
  sendMessage,
} from "../controllers/messages_controller.js";

const router = Router();

router.route("/get-conversations").get(authentication, getConversations);
router.route("/get-messages/:conversationId").get(authentication, getMessages);
router.route("/send-message").post(authentication, sendMessage);

export default router;