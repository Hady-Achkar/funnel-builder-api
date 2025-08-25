import { Router } from "express";
import { registerRoute } from "./register/route/register.route";
import { loginRoute } from "./login/route/login.route";
import { userRoute } from "./user/route/user.route";

const router = Router();

router.use("/register", registerRoute);
router.use("/login", loginRoute);
router.use("/user", userRoute);

export { router as authRoutes };
