import { Router } from "express";
import { CreateUserSchema } from "#/utils/validationSchema";
import { validate } from "#/middleware/validator";
import { create, verifyEmail } from "#/controllers/user";

const router = Router();

router.post('/create', validate(CreateUserSchema), create);
router.post('/verify-email', verifyEmail);

export default router;