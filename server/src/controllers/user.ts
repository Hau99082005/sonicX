import { CreateUser } from "#/@types/user";
import User from "#/models/User";
import { generateToken } from "#/utils/helper";
import { CreateUserSchema } from "#/utils/validationSchema";
import { MAILTRAP_PASS, MAILTRAP_USER } from "#/utils/variables";
import bcrypt from "bcryptjs";
import { RequestHandler } from "express";
import emailVerificationToken from "#/models/emailVerificationToken";
import nodemailer from "nodemailer";
import { generateTemplate } from "#/mail/template";
import path from "path";

export const create: RequestHandler = async (req: CreateUser, res) => {
    try {
        const { name, email, password } = req.body;
        CreateUserSchema.validate({ email, name, password });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);



        const newUser = await User.create({
            name,
            email,
            password: hashedPassword
        });


        //gửi email xác minh
        const transport = nodemailer.createTransport({
            host: "sandbox.smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: MAILTRAP_USER,
                pass: MAILTRAP_PASS
            }
        });

        //token = 6 digit otp => vd: 123456 => gửi
        //token = đính kèm các mã thông báo này vào <a href="">=> xác thực
        const token = generateToken();
        await emailVerificationToken.create({
            owner: newUser._id,
            token,
        });

        const welcomeMessage = `Chào mừng ${newUser.name} đến với SonicX! cảm ơn bạn đã đăng ký tài khoản. vui lòng xác minh email của bạn bằng cách sử dụng mã OTP sau: ${token}.
        Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.`;

        transport.sendMail({
            to: newUser.email,
            from: "auth@sonicX.com",
            html: generateTemplate({
                title: "Chào mừng bạn đến với SonicX",
                message: welcomeMessage,
                logo: "cid:logo",
                banner: "cid:welcome",
                link: "#",
                btnTitle: token
            }),
            attachments: [
                {
                    filename: "logo.png",
                    path: path.join(__dirname, "../assets/images/sonicX_logo.png"),
                    cid: "logo"
                },
                {
                    filename: "welcome.png",
                    path: path.join(__dirname, "../assets/images/welcome.png"),
                    cid: "welcome"
                }
            ]
        })

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
}