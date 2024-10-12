import express from "express";
import { getMe, login, logout, signup } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

//这是authRouters
const router = express.Router();


// host/api/auth/me 先触发保护中间件验权，再调用获取自己信息的函数
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protectRoute, getMe);

export default router;//authRouters下的方法全部被重写了
