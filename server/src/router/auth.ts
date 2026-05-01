import { CreateUser } from "#/@types/user";
import User from "#/models/User";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { CreateUserSchema } from "#/utils/validationSchema";
import { validate } from "#/middleware/validator";

const router = Router();

router.post('/create',
    validate(CreateUserSchema),
    async (req: CreateUser, res) => {
        try {
            const { name, email, password } = req.body;
            CreateUserSchema.validate({ email, name, password })
                .catch(error => {

                });
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = await User.create({
                name,
                email,
                password: hashedPassword
            });

            return res.status(201).json({
                message: "Tạo user thành công",
                user: newUser
            });
        } catch (error) {
            return res.status(500).json({
                message: "Internal Server Error",
                error
            });
        }
    });

export default router;