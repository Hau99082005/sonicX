"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetSuccessEmail = exports.sendForgotPasswordLink = exports.sendVerificationMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const template_1 = require("../mail/template");
const path_1 = __importDefault(require("path"));
const variables_1 = require("../utils/variables");
const generateMailTransporter = () => {
    const transport = nodemailer_1.default.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: variables_1.MAILTRAP_USER,
            pass: variables_1.MAILTRAP_PASS
        }
    });
    return transport;
};
const sendVerificationMail = (token, profile) => __awaiter(void 0, void 0, void 0, function* () {
    const transport = generateMailTransporter();
    const { name, email, userId } = profile;
    const welcomeMessage = `Chào mừng ${name} đến với SonicX! cảm ơn bạn đã đăng ký tài khoản. vui lòng xác minh email của bạn bằng cách sử dụng mã OTP sau: ${token}.
        Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.`;
    transport.sendMail({
        to: email,
        from: variables_1.VERIFICATION_EMAIL,
        subject: "Xác minh email của bạn",
        html: (0, template_1.generateTemplate)({
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
                path: path_1.default.join(__dirname, "../assets/images/sonicX_logo.png"),
                cid: "logo"
            },
            {
                filename: "welcome.png",
                path: path_1.default.join(__dirname, "../assets/images/welcome.png"),
                cid: "welcome"
            }
        ]
    });
});
exports.sendVerificationMail = sendVerificationMail;
const sendForgotPasswordLink = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const transport = generateMailTransporter();
    const { email, link } = options;
    const message = `Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. vui lòng đăng nhập vào liên kết sau để đặt lại mật khẩu của mình: ${link}.
  Nếu bạn không yêu cầu đặt lại mật khẩu này, vui lòng bỏ qua email này.`;
    transport.sendMail({
        to: email,
        from: variables_1.VERIFICATION_EMAIL,
        subject: "Đặt lại mật khẩu của bạn",
        html: (0, template_1.generateTemplate)({
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
                path: path_1.default.join(__dirname, "../assets/images/sonicX_logo.png"),
                cid: "logo"
            },
            {
                filename: "reset.png",
                path: path_1.default.join(__dirname, "../assets/images/reset.png"),
                cid: "reset"
            },
        ]
    });
});
exports.sendForgotPasswordLink = sendForgotPasswordLink;
const sendPasswordResetSuccessEmail = (name, email) => __awaiter(void 0, void 0, void 0, function* () {
    const transport = generateMailTransporter();
    const message = `gần đây ${name} đã đặt lại mật khẩu mới cho tài khoản của mình.
    nếu bạn không thực hiện hành động này, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi 
    ngay để bảo vệ tài khoản của bạn`;
    transport.sendMail({
        to: email,
        from: variables_1.VERIFICATION_EMAIL,
        subject: "Mật khẩu của bạn đã được đặt lại thành công!",
        html: (0, template_1.generateTemplate)({
            title: "Mật khẩu của bạn đã được đặt lại thành công!",
            message,
            logo: "cid:logo",
            banner: "cid:reset",
            link: variables_1.SIGN_IN_LINK,
            btnTitle: "Đăng nhập"
        }),
        attachments: [
            {
                filename: "logo.png",
                path: path_1.default.join(__dirname, "../assets/images/sonicX_logo.png"),
                cid: "logo"
            },
            {
                filename: "reset.png",
                path: path_1.default.join(__dirname, "../assets/images/reset.png"),
                cid: "reset"
            },
        ]
    });
});
exports.sendPasswordResetSuccessEmail = sendPasswordResetSuccessEmail;
