import { MailtrapClient } from "mailtrap";
import { generateTemplate } from "#/mail/template";
import {
  MAILTRAP_API_TOKEN,
  MAILTRAP_INBOX_ID,
  MAILTRAP_USE_SANDBOX,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  TWILIO_VERIFY_SERVICE_SID,
  SIGN_IN_LINK,
  GMAIL_USER,
  GMAIL_APP_PASSWORD,
} from "#/utils/variables";
import nodemailer from "nodemailer";
import path from "path";
import sharp from "sharp";
import twilio from "twilio";

// Khởi tạo Mailtrap client
// - sandbox: true  → email vào hộp thư test trên Mailtrap (dùng khi dev)
// - sandbox: false → email gửi thật tới Gmail người dùng (dùng khi production)
const isSandbox = MAILTRAP_USE_SANDBOX === "true";

const client = new MailtrapClient({
  token: MAILTRAP_API_TOKEN,
  sandbox: isSandbox,
  testInboxId: isSandbox ? Number(MAILTRAP_INBOX_ID) : undefined,
});

const gmailTransporter =
  GMAIL_USER && GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_APP_PASSWORD,
        },
      })
    : null;

const sendEmail = async (options: any) => {
  if (isSandbox) {
    return client.send(options);
  }

  if (gmailTransporter) {
    const toEmails = options.to
      .map((recipient: any) => recipient.email)
      .join(", ");
    const fromEmail = GMAIL_USER
      ? `SonicX <${GMAIL_USER}>`
      : `SonicX <${FROM_EMAIL}>`;
    return gmailTransporter.sendMail({
      from: fromEmail,
      to: toEmails,
      subject: options.subject,
      html: options.html,
    });
  }

  return client.send(options);
};

// Resize ảnh và chuyển sang base64 để nhúng vào HTML email
// resizeWidth: chiều rộng tối đa (px) — giúp email không quá nặng
const toBase64 = async (
  filePath: string,
  resizeWidth: number,
): Promise<string> => {
  try {
    console.log(`[toBase64] Loading image from: ${filePath}`);
    const buffer = await sharp(filePath)
      .resize(resizeWidth)
      .png({ compressionLevel: 9 })
      .toBuffer();
    console.log(
      `[toBase64] Image loaded successfully, size: ${buffer.length} bytes`,
    );
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.error(`[toBase64] Error loading image from ${filePath}:`, error);
    // Return empty 1x1 transparent PNG as fallback
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
  }
};

const ASSETS = path.join(__dirname, "../assets/images");

// Địa chỉ gửi email
// - Sandbox: dùng email giả bất kỳ
// - Production: phải là email thuộc domain đã verify trên Mailtrap
const FROM_EMAIL = isSandbox
  ? "verification@sonicx.com"
  : "verification@sonicx.com";

interface Profile {
  name: string;
  email: string;
  userId: string;
}

// Gửi email xác minh OTP khi đăng ký tài khoản
export const sendVerificationMail = async (token: string, profile: Profile) => {
  const { name, email } = profile;

  const [logo, banner] = await Promise.all([
    toBase64(`${ASSETS}/sonicX_logo.png`, 160),
    toBase64(`${ASSETS}/welcome.png`, 560),
  ]);

  const welcomeMessage = `Chào mừng ${name} đến với SonicX! Cảm ơn bạn đã đăng ký tài khoản. Vui lòng xác minh email của bạn bằng cách sử dụng mã OTP sau: <strong>${token}</strong>. Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.`;

  await sendEmail({
    from: { name: "SonicX", email: FROM_EMAIL },
    to: [{ email }],
    subject: "Xác minh email của bạn - SonicX",
    html: generateTemplate({
      title: "Chào mừng bạn đến với SonicX",
      message: welcomeMessage,
      logo,
      banner,
      link: "#",
      btnTitle: token,
    }),
  });
};

interface Options {
  email: string;
  link: string;
}

// Gửi email chứa link đặt lại mật khẩu khi quên mật khẩu
export const sendForgotPasswordLink = async (options: Options) => {
  const { email, link } = options;

  const [logo, banner] = await Promise.all([
    toBase64(`${ASSETS}/sonicX_logo.png`, 160),
    toBase64(`${ASSETS}/reset.png`, 560),
  ]);

  await sendEmail({
    from: { name: "SonicX", email: FROM_EMAIL },
    to: [{ email }],
    subject: "Đặt lại mật khẩu của bạn - SonicX",
    html: generateTemplate({
      title: "Đặt lại mật khẩu của bạn",
      message:
        "Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu. Nếu bạn không yêu cầu đặt lại mật khẩu này, vui lòng bỏ qua email này.",
      logo,
      banner,
      link,
      btnTitle: "Đặt lại mật khẩu",
    }),
  });
};

// Gửi email thông báo đặt lại mật khẩu thành công
export const sendPasswordResetSuccessEmail = async (
  name: string,
  email: string,
) => {
  const [logo, banner] = await Promise.all([
    toBase64(`${ASSETS}/sonicX_logo.png`, 160),
    toBase64(`${ASSETS}/reset.png`, 560),
  ]);

  await sendEmail({
    from: { name: "SonicX", email: FROM_EMAIL },
    to: [{ email }],
    subject: "Mật khẩu đã được đặt lại thành công - SonicX",
    html: generateTemplate({
      title: "Mật khẩu của bạn đã được đặt lại thành công!",
      message: `Gần đây ${name} đã đặt lại mật khẩu mới cho tài khoản của mình. Nếu bạn không thực hiện hành động này, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi ngay để bảo vệ tài khoản của bạn.`,
      logo,
      banner,
      link: SIGN_IN_LINK,
      btnTitle: "Đăng nhập",
    }),
  });
};

// Gửi OTP qua email (dùng tạm nếu không có SMS provider)
export const sendPhoneVerificationOTP = async (
  token: string,
  phone: string,
  name: string,
  email: string,
) => {
  console.log(`[sendPhoneVerificationOTP] Starting email send to: ${email}`);

  if (!email) {
    throw new Error("User email is required to send OTP");
  }

  const [logo, banner] = await Promise.all([
    toBase64(`${ASSETS}/sonicX_logo.png`, 160),
    toBase64(`${ASSETS}/welcome.png`, 560),
  ]);

  const message = `Mã OTP xác minh điện thoại của bạn là: <strong>${token}</strong>. Mã này sẽ hết hạn trong 10 phút. Vui lòng không chia sẻ mã này với bất kỳ ai. Số điện thoại: ${phone}`;

  console.log(
    `[sendPhoneVerificationOTP] About to send email from: ${FROM_EMAIL}, to: ${email}`,
  );

  const response = await sendEmail({
    from: { name: "SonicX", email: FROM_EMAIL },
    to: [{ email }], // Gửi tới email của user
    subject: "Mã OTP xác minh điện thoại - SonicX",
    html: generateTemplate({
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
};

// Gửi OTP qua SMS bằng Twilio
const twilioClient =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

export const sendPhoneVerificationSMS = async (
  token: string | undefined,
  phone: string,
) => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error(
      "Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.",
    );
  }

  if (!twilioClient) {
    throw new Error("Twilio client initialization failed.");
  }

  if (TWILIO_VERIFY_SERVICE_SID) {
    console.log(
      `[sendPhoneVerificationSMS] Using Twilio Verify service ${TWILIO_VERIFY_SERVICE_SID}`,
    );
    try {
      const response = await twilioClient.verify.v2
        .services(TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({ to: phone, channel: "sms" });

      console.log(
        `[sendPhoneVerificationSMS] Verify request sent to ${phone}, sid=${response.sid}, status=${response.status}`,
      );
      return response;
    } catch (error) {
      if (error instanceof Error && (error as any).code === 21608) {
        throw new Error(
          "Twilio Verify SMS failed because the recipient phone number is unverified on a trial account. Verify the number in Twilio console or upgrade your Twilio account.",
        );
      }
      throw error;
    }
  }

  if (!token) {
    throw new Error(
      "SMS token is required when TWILIO_VERIFY_SERVICE_SID is not configured.",
    );
  }

  if (!TWILIO_PHONE_NUMBER) {
    throw new Error(
      "TWILIO_PHONE_NUMBER is not configured. Set TWILIO_PHONE_NUMBER or TWILIO_VERIFY_SERVICE_SID.",
    );
  }

  const message = `SonicX: Mã xác minh của bạn là ${token}. Mã sẽ hết hạn trong 10 phút. Không chia sẻ mã này với bất kỳ ai.`;

  const response = await twilioClient.messages.create({
    body: message,
    from: TWILIO_PHONE_NUMBER,
    to: phone,
  });

  console.log(
    `[sendPhoneVerificationSMS] SMS sent to ${phone}, sid=${response.sid}`,
  );
  return response;
};

export const verifyPhoneVerificationCode = async (
  phone: string,
  code: string,
) => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error(
      "Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.",
    );
  }
  if (!twilioClient) {
    throw new Error("Twilio client initialization failed.");
  }
  if (!TWILIO_VERIFY_SERVICE_SID) {
    throw new Error("TWILIO_VERIFY_SERVICE_SID is not configured.");
  }

  const verificationCheck = await twilioClient.verify.v2
    .services(TWILIO_VERIFY_SERVICE_SID)
    .verificationChecks.create({ to: phone, code });

  console.log(
    `[verifyPhoneVerificationCode] Verify check for ${phone} status=${verificationCheck.status}`,
  );
  return verificationCheck;
};
