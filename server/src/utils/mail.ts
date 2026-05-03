
import nodemailer from "nodemailer";
import { generateTemplate } from "#/mail/template";
import path from "path";
import { MAILTRAP_PASS, MAILTRAP_USER, SIGN_IN_LINK, VERIFICATION_EMAIL } from "#/utils/variables";


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
    const { name, email, userId } = profile;


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

interface Options {
    email: string;
    link: string;

}

export const sendForgotPasswordLink = async (options: Options) => {
    const transport = generateMailTransporter();
    const { email, link } = options;
    const message = `Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. vui lòng đăng nhập vào liên kết sau để đặt lại mật khẩu của mình: ${link}.
  Nếu bạn không yêu cầu đặt lại mật khẩu này, vui lòng bỏ qua email này.`;
    transport.sendMail({
        to: email,
        from: VERIFICATION_EMAIL,
        subject: "Đặt lại mật khẩu của bạn",
        html: generateTemplate({
            title: "Đặt lại mật khẩu của bạn",
            message,
            logo: "cid:logo",
            banner: "cid:reset",
            link,
            btnTitle: "Đặt lại mật khẩu"
        }),
        attachments: [
            {
                filename: "logo.png",
                path: path.join(__dirname, "../assets/images/sonicX_logo.png"),
                cid: "logo"
            },
            {
                filename: "reset.png",
                path: path.join(__dirname, "../assets/images/reset.png"),
                cid: "reset"
            },
        ]
    })
};

export const sendPasswordResetSuccessEmail = async (name: string, email: string) => {
    const transport = generateMailTransporter();
    const message = `gần đây ${name} đã đặt lại mật khẩu mới cho tài khoản của mình.
    nếu bạn không thực hiện hành động này, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi 
    ngay để bảo vệ tài khoản của bạn`;
    transport.sendMail({
        to: email,
        from: VERIFICATION_EMAIL,
        subject: "Mật khẩu của bạn đã được đặt lại thành công!",
        html: generateTemplate({
            title: "Mật khẩu của bạn đã được đặt lại thành công!",
            message,
            logo: "cid:logo",
            banner: "cid:reset",
            link: SIGN_IN_LINK,
            btnTitle: "Đăng nhập"
        }),
        attachments: [
            {
                filename: "logo.png",
                path: path.join(__dirname, "../assets/images/sonicX_logo.png"),
                cid: "logo"
            },
            {
                filename: "reset.png",
                path: path.join(__dirname, "../assets/images/reset.png"),
                cid: "reset"
            },
        ]
    })
}