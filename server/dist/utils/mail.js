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
exports.verifyPhoneVerificationCode = exports.sendPhoneVerificationSMS = exports.sendPhoneVerificationOTP = exports.sendPasswordResetSuccessEmail = exports.sendForgotPasswordLink = exports.sendVerificationMail = void 0;
const mailtrap_1 = require("mailtrap");
const template_1 = require("../mail/template");
const variables_1 = require("../utils/variables");
const nodemailer_1 = __importDefault(require("nodemailer"));
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const twilio_1 = __importDefault(require("twilio"));
const isSandbox = variables_1.MAILTRAP_USE_SANDBOX === "true";
const client = new mailtrap_1.MailtrapClient({
    token: variables_1.MAILTRAP_API_TOKEN,
    sandbox: isSandbox,
    testInboxId: isSandbox ? Number(variables_1.MAILTRAP_INBOX_ID) : undefined,
});
const gmailTransporter = variables_1.GMAIL_USER && variables_1.GMAIL_APP_PASSWORD
    ? nodemailer_1.default.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: variables_1.GMAIL_USER,
            pass: variables_1.GMAIL_APP_PASSWORD,
        },
    })
    : null;
const sendEmail = (options) => __awaiter(void 0, void 0, void 0, function* () {
    if (isSandbox) {
        return client.send(options);
    }
    if (gmailTransporter) {
        const toEmails = options.to
            .map((recipient) => recipient.email)
            .join(", ");
        const fromEmail = variables_1.GMAIL_USER
            ? `SonicX <${variables_1.GMAIL_USER}>`
            : `SonicX <${FROM_EMAIL}>`;
        return gmailTransporter.sendMail({
            from: fromEmail,
            to: toEmails,
            subject: options.subject,
            html: options.html,
        });
    }
    return client.send(options);
});
const toBase64 = (filePath, resizeWidth) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`[toBase64] Loading image from: ${filePath}`);
        const buffer = yield (0, sharp_1.default)(filePath)
            .resize(resizeWidth)
            .png({ compressionLevel: 9 })
            .toBuffer();
        console.log(`[toBase64] Image loaded successfully, size: ${buffer.length} bytes`);
        return `data:image/png;base64,${buffer.toString("base64")}`;
    }
    catch (error) {
        console.error(`[toBase64] Error loading image from ${filePath}:`, error);
        return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
    }
});
const ASSETS = path_1.default.join(__dirname, "../assets/images");
const FROM_EMAIL = isSandbox
    ? "verification@sonicx.com"
    : "verification@sonicx.com";
const sendVerificationMail = (token, profile) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email } = profile;
    const [logo, banner] = yield Promise.all([
        toBase64(`${ASSETS}/sonicX_logo.png`, 160),
        toBase64(`${ASSETS}/welcome.png`, 560),
    ]);
    const welcomeMessage = `Chào mừng ${name} đến với SonicX! Cảm ơn bạn đã đăng ký tài khoản. Vui lòng xác minh email của bạn bằng cách sử dụng mã OTP sau: <strong>${token}</strong>. Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.`;
    yield sendEmail({
        from: { name: "SonicX", email: FROM_EMAIL },
        to: [{ email }],
        subject: "Xác minh email của bạn - SonicX",
        html: (0, template_1.generateTemplate)({
            title: "Chào mừng bạn đến với SonicX",
            message: welcomeMessage,
            logo,
            banner,
            link: "#",
            btnTitle: token,
        }),
    });
});
exports.sendVerificationMail = sendVerificationMail;
const sendForgotPasswordLink = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, link } = options;
    const [logo, banner] = yield Promise.all([
        toBase64(`${ASSETS}/sonicX_logo.png`, 160),
        toBase64(`${ASSETS}/reset.png`, 560),
    ]);
    yield sendEmail({
        from: { name: "SonicX", email: FROM_EMAIL },
        to: [{ email }],
        subject: "Đặt lại mật khẩu của bạn - SonicX",
        html: (0, template_1.generateTemplate)({
            title: "Đặt lại mật khẩu của bạn",
            message: "Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu. Nếu bạn không yêu cầu đặt lại mật khẩu này, vui lòng bỏ qua email này.",
            logo,
            banner,
            link,
            btnTitle: "Đặt lại mật khẩu",
        }),
    });
});
exports.sendForgotPasswordLink = sendForgotPasswordLink;
const sendPasswordResetSuccessEmail = (name, email) => __awaiter(void 0, void 0, void 0, function* () {
    const [logo, banner] = yield Promise.all([
        toBase64(`${ASSETS}/sonicX_logo.png`, 160),
        toBase64(`${ASSETS}/reset.png`, 560),
    ]);
    yield sendEmail({
        from: { name: "SonicX", email: FROM_EMAIL },
        to: [{ email }],
        subject: "Mật khẩu đã được đặt lại thành công - SonicX",
        html: (0, template_1.generateTemplate)({
            title: "Mật khẩu của bạn đã được đặt lại thành công!",
            message: `Gần đây ${name} đã đặt lại mật khẩu mới cho tài khoản của mình. Nếu bạn không thực hiện hành động này, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi ngay để bảo vệ tài khoản của bạn.`,
            logo,
            banner,
            link: variables_1.SIGN_IN_LINK,
            btnTitle: "Đăng nhập",
        }),
    });
});
exports.sendPasswordResetSuccessEmail = sendPasswordResetSuccessEmail;
const sendPhoneVerificationOTP = (token, phone, name, email) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`[sendPhoneVerificationOTP] Starting email send to: ${email}`);
    if (!email) {
        throw new Error("User email is required to send OTP");
    }
    const [logo, banner] = yield Promise.all([
        toBase64(`${ASSETS}/sonicX_logo.png`, 160),
        toBase64(`${ASSETS}/welcome.png`, 560),
    ]);
    const message = `Mã OTP xác minh điện thoại của bạn là: <strong>${token}</strong>. Mã này sẽ hết hạn trong 10 phút. Vui lòng không chia sẻ mã này với bất kỳ ai. Số điện thoại: ${phone}`;
    console.log(`[sendPhoneVerificationOTP] About to send email from: ${FROM_EMAIL}, to: ${email}`);
    const response = yield sendEmail({
        from: { name: "SonicX", email: FROM_EMAIL },
        to: [{ email }],
        subject: "Mã OTP xác minh điện thoại - SonicX",
        html: (0, template_1.generateTemplate)({
            title: "Xác minh điện thoại của bạn",
            message,
            logo,
            banner,
            link: "#",
            btnTitle: token,
        }),
    });
    console.log(`[sendPhoneVerificationOTP] Email sent successfully`);
    return response;
});
exports.sendPhoneVerificationOTP = sendPhoneVerificationOTP;
const twilioClient = variables_1.TWILIO_ACCOUNT_SID && variables_1.TWILIO_AUTH_TOKEN
    ? (0, twilio_1.default)(variables_1.TWILIO_ACCOUNT_SID, variables_1.TWILIO_AUTH_TOKEN)
    : null;
const sendPhoneVerificationSMS = (token, phone) => __awaiter(void 0, void 0, void 0, function* () {
    if (!variables_1.TWILIO_ACCOUNT_SID || !variables_1.TWILIO_AUTH_TOKEN) {
        throw new Error("Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
    }
    if (!twilioClient) {
        throw new Error("Twilio client initialization failed.");
    }
    if (variables_1.TWILIO_VERIFY_SERVICE_SID) {
        console.log(`[sendPhoneVerificationSMS] Using Twilio Verify service ${variables_1.TWILIO_VERIFY_SERVICE_SID}`);
        try {
            const response = yield twilioClient.verify.v2
                .services(variables_1.TWILIO_VERIFY_SERVICE_SID)
                .verifications.create({ to: phone, channel: "sms" });
            console.log(`[sendPhoneVerificationSMS] Verify request sent to ${phone}, sid=${response.sid}, status=${response.status}`);
            return response;
        }
        catch (error) {
            if (error instanceof Error && error.code === 21608) {
                throw new Error("Twilio Verify SMS failed because the recipient phone number is unverified on a trial account. Verify the number in Twilio console or upgrade your Twilio account.");
            }
            throw error;
        }
    }
    if (!token) {
        throw new Error("SMS token is required when TWILIO_VERIFY_SERVICE_SID is not configured.");
    }
    if (!variables_1.TWILIO_PHONE_NUMBER) {
        throw new Error("TWILIO_PHONE_NUMBER is not configured. Set TWILIO_PHONE_NUMBER or TWILIO_VERIFY_SERVICE_SID.");
    }
    const message = `SonicX: Mã xác minh của bạn là ${token}. Mã sẽ hết hạn trong 10 phút. Không chia sẻ mã này với bất kỳ ai.`;
    const response = yield twilioClient.messages.create({
        body: message,
        from: variables_1.TWILIO_PHONE_NUMBER,
        to: phone,
    });
    console.log(`[sendPhoneVerificationSMS] SMS sent to ${phone}, sid=${response.sid}`);
    return response;
});
exports.sendPhoneVerificationSMS = sendPhoneVerificationSMS;
const verifyPhoneVerificationCode = (phone, code) => __awaiter(void 0, void 0, void 0, function* () {
    if (!variables_1.TWILIO_ACCOUNT_SID || !variables_1.TWILIO_AUTH_TOKEN) {
        throw new Error("Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
    }
    if (!twilioClient) {
        throw new Error("Twilio client initialization failed.");
    }
    if (!variables_1.TWILIO_VERIFY_SERVICE_SID) {
        throw new Error("TWILIO_VERIFY_SERVICE_SID is not configured.");
    }
    const verificationCheck = yield twilioClient.verify.v2
        .services(variables_1.TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({ to: phone, code });
    console.log(`[verifyPhoneVerificationCode] Verify check for ${phone} status=${verificationCheck.status}`);
    return verificationCheck;
});
exports.verifyPhoneVerificationCode = verifyPhoneVerificationCode;
