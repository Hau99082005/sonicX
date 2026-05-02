
import emailVerificationToken from "#/models/emailVerificationToken";
import nodemailer from "nodemailer";
import { generateTemplate } from "#/mail/template";
import path from "path";
import { MAILTRAP_PASS, MAILTRAP_USER, VERIFICATION_EMAIL } from "#/utils/variables";


const generateMailTransporter = () => {
    //gửi email xác minh
    const transport = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: MAILTRAP_USER,
            pass: MAILTRAP_PASS
        }
    });
    return transport;
}

interface Profile {
  name: string;
  email: string;
  userId: string;
}

export const sendVerificationMail = async (token: string, profile: Profile) => {
    const transport = generateMailTransporter();
    //token = 6 digit otp => vd: 123456 => gửi
    //token = đính kèm các mã thông báo này vào <a href="">=> xác thực
    const { name, email, userId} = profile;
    await emailVerificationToken.create({
        owner: userId,
        token,
    });

    const welcomeMessage = `Chào mừng ${name} đến với SonicX! cảm ơn bạn đã đăng ký tài khoản. vui lòng xác minh email của bạn bằng cách sử dụng mã OTP sau: ${token}.
        Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.`;

    transport.sendMail({
        to: email,
        from: VERIFICATION_EMAIL, 
        subject: "Xác minh email của bạn",
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
}
