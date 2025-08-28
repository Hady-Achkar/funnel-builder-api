import { Router } from "express";
import { registerRoute } from "./register/route/register.route";
import { loginRoute } from "./login/route/login.route";
import { userRoute } from "./user/route/user.route";
import { verifyRoute } from "./verify/route";
import { forgotPasswordRoute } from "./forgot-password/route";
import { resetPasswordRoute } from "./reset-password/route";
import { logoutRoute } from "./logout";

const router = Router();

router.use("/register", registerRoute);
router.use("/login", loginRoute);
router.use("/user", userRoute);
router.use("/verify", verifyRoute);
router.use("/forgot-password", forgotPasswordRoute);
router.use("/reset-password", resetPasswordRoute);
router.use("/", logoutRoute);

export { router as authRoutes };
