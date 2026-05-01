import { Router } from "express";
import { CreateUserSchema } from "#/utils/validationSchema";
import { validate } from "#/middleware/validator";
import { create } from "#/controllers/user";

const router = Router();

router.post('/create', validate(CreateUserSchema), create);

export default router;