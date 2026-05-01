import User from "#/models/User";
import { Router } from "express";
import bcrypt from "bcryptjs";

const router = Router();

router.post('/create', async (req, res) => {
    try {
        const { name, email, password } = req.body; 
        if(!name || !email || !password) {
            return res.status(400).json({
                message: "Invalid required!"
            });
        }

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