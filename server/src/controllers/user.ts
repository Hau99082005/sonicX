import { CreateUser, VerifyEmailRequest } from "#/@types/user";
import emailVerificationToken from "#/models/emailVerificationToken";
import phoneVerificationToken from "#/models/phoneVerificationToken";
import User from "#/models/User";
import { formatProfile, generateToken } from "#/utils/helper";
import {
  sendForgotPasswordLink,
  sendPasswordResetSuccessEmail,
  sendVerificationMail,
  sendPhoneVerificationOTP,
  sendPhoneVerificationSMS,
  verifyPhoneVerificationCode,
} from "#/utils/mail";
import { CreateUserSchema } from "#/utils/validationSchema";
import { RequestHandler } from "express";
import axios from "axios";
import { isValidObjectId } from "mongoose";
import passwordResetToken from "#/models/passwordResetToken";
import crypto from "crypto";
import {
  JWT_SECRET,
  PASSWORD_RESET_URL,
  TWILIO_VERIFY_SERVICE_SID,
} from "#/utils/variables";
import jwt from "jsonwebtoken";
import cloudinary from "#/cloud";
import formidable from "formidable";

export const create: RequestHandler = async (req: CreateUser, res) => {
  try {
    const { name, email, password } = req.body;
    const oldUser = await User.findOne({
      email,
    });
    if (oldUser)
      return res.status(403).json({ error: "Email is already in use!" });
    CreateUserSchema.validate({ email, name, password });

    const newUser = await User.create({
      name,
      email,
      password,
    });
    const token = generateToken();
    await emailVerificationToken.create({
      owner: newUser._id.toString(),
      token,
    });
    sendVerificationMail(token, {
      name,
      email,
      userId: newUser._id.toString(),
    }).catch((err) =>
      console.error("[mail] sendVerificationMail failed:", err),
    );

    return res.status(201).json({
      message: "Tạo user thành công",
      user: { id: newUser._id, name, email },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error,
    });
  }
};

export const verifyEmail: RequestHandler = async (
  req: VerifyEmailRequest,
  res,
) => {
  const { token, userId } = req.body;
  const verificationToken = await emailVerificationToken.findOne({
    owner: userId,
  });

  if (!verificationToken)
    return res.status(403).json({ error: "Invalid token! (not found in DB)" });
  const matched = await verificationToken.compareToken(token);
  if (!matched)
    return res.status(403).json({ error: "Invalid token! (token mismatch)" });

  await User.findByIdAndUpdate(userId, {
    verified: true,
  });
  await emailVerificationToken.findByIdAndDelete(verificationToken._id);
  res.status(200).json({ message: "Email verified successfully!" });
};

export const sendReVerificationToken: RequestHandler = async (req, res) => {
  const { userId } = req.body;
  if (!isValidObjectId(userId))
    return res.status(403).json({ error: "Invalid request!" });
  const user = await User.findById(userId);
  if (!user) return res.status(403).json({ error: "Invalid request!" });

  if (user.verified)
    return res.status(422).json({ error: "You account is already verified!" });

  await emailVerificationToken.findOneAndDelete({
    owner: userId,
  });
  const token = generateToken();
  await emailVerificationToken.create({
    owner: userId,
    token,
  });
  sendVerificationMail(token, {
    name: user?.name,
    email: user?.email,
    userId: user?._id.toString(),
  });

  res
    .status(200)
    .json({ message: "Please check your email for verification!" });
};

export const generateForgotPasswordLink: RequestHandler = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "Account not found!" });
  await passwordResetToken.findOneAndDelete({
    owner: user._id.toString(),
  });
  const token = crypto.randomBytes(36).toString("hex");
  await passwordResetToken.create({
    owner: user._id.toString(),
    token,
  });
  const resetLink = `${PASSWORD_RESET_URL}?token=${token}&userId=${user._id.toString()}`;
  sendForgotPasswordLink({
    email: user.email,
    link: resetLink,
  });
  res
    .status(200)
    .json({ message: "Please check your email for the password reset link!" });
};

export const grantValid: RequestHandler = async (req, res) => {
  res.status(200).json({ valid: true });
};

export const updatePassword: RequestHandler = async (req, res) => {
  const { password, userId } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(403).json({ error: "Unauthorized access!" });
  const matched = await user.comparePassword(password);
  if (matched)
    return res
      .status(422)
      .json({ error: "The new password must be different!" });
  user.password = password;
  await user.save();
  await passwordResetToken.findOneAndDelete({ owner: user._id.toString() });
  sendPasswordResetSuccessEmail(user.name, user.email);
  res.status(200).json({ message: "Password updated successfully!" });
};

export const SignIn: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(403).json({ error: "Email/password mismatch!" });
  const matched = await user.comparePassword(password);
  if (!matched)
    return res.status(403).json({ error: "Email/password mismatch!" });
  const token = jwt.sign(
    {
      userId: user._id.toString(),
    },
    JWT_SECRET,
  );
  user.token.push(token);
  await user.save();

  res.status(200).json({
    profile: {
      id: user._id,
      name: user.name,
      email: user.email,
      verified: user.verified,
      avatar: user.avatar?.url,
      followers: user.followers.length,
      following: user.followings.length,
    },
    token,
  });
};

export const updateProfile: RequestHandler = async (req, res) => {
  const { name } = req.body;
  const avatar = req.files?.avatar as formidable.File;

  const user = await User.findById(req.user.id);
  if (!user) throw new Error("something went wrong, user not found!");
  if (typeof name !== "string")
    return res.status(422).json({ error: "Invalid name!" });
  if (name.trim().length < 3)
    return res
      .status(422)
      .json({ error: "Name must be at least 3 characters long!" });
  user.name = name;
  if (avatar) {
    //if these is already an avatar file, we want to remove that
    if (user.avatar?.publicId) {
      await cloudinary.uploader.destroy(user.avatar.publicId);
    }

    //upload new avatar file
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      avatar.filepath,
      {
        width: 400,
        height: 400,
        crop: "thumb",
        gravity: "face",
      },
    );
    user.avatar = { url: secure_url, publicId: public_id };
  }
  await user.save();
  res.status(200).json({ profile: formatProfile(user) });
};

export const sendProfile: RequestHandler = (req, res) => {
  res.status(200).json({ profile: req.user });
};

export const logOut: RequestHandler = async (req, res) => {
  const { fromAll } = req.query;
  const token = req.token;
  const user = await User.findById(req.user.id);
  if (!user) throw new Error("something went wrong, user not found!");
  if (fromAll === "yes") user.token = [];
  else user.token = user.token.filter((tokens) => tokens !== token);

  await user.save();
  res.status(200).json({ success: true });
};

export const getUser: RequestHandler = async (req, res) => {
  const user = await User.find({}).sort({ createdAt: -1 });
  if (user) {
    return res.status(200).json({ user });
  } else {
    return res.status(404).json({ message: "User not found!" });
  }
};

export const googleSignIn: RequestHandler = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(422).json({ error: "idToken is required!" });

  try {
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );
    const { email, name, picture, aud, email_verified } = response.data;

    if (!email) {
      return res.status(422).json({ error: "Google account must have an email!" });
    }

    const validAudiences = [
      "739589186628-rpv9rta58toreqlv3mls1jpms763668b.apps.googleusercontent.com",
      "739589186628-6d69h4pqnjm4cuo3e0tq35p9re0ev4jo.apps.googleusercontent.com",
    ];
    if (!validAudiences.includes(aud)) {
      return res.status(401).json({ error: "Invalid token audience!" });
    }

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = new User({
        name: name || email.split("@")[0],
        email,
        password: crypto.randomBytes(32).toString("hex"),
        verified: false,
      });
      if (picture) {
        user.avatar = { url: picture, publicId: "" };
      }
      await user.save();

      const otp = generateToken();
      await emailVerificationToken.create({
        owner: user._id.toString(),
        token: otp,
      });
      sendVerificationMail(otp, {
        name: user.name,
        email: user.email,
        userId: user._id.toString(),
      });
    }

    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET);
    user.token.push(token);
    await user.save();

    return res.status(200).json({
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        verified: user.verified,
        avatar: user.avatar?.url,
        followers: user.followers.length,
        following: user.followings.length,
      },
      token,
      message: isNewUser
        ? "Vui lòng kiểm tra email để xác thực tài khoản!"
        : undefined,
    });
  } catch (error) {
    console.error("Google sign-in error:", error);
    return res.status(401).json({
      error: "Invalid or expired Google token!",
      detail: (error as Error).message,
    });
  }
};

// Gửi mã OTP tới số điện thoại
export const sendPhoneOTP: RequestHandler = async (req, res) => {
  try {
    const { userId, phone } = req.body;

    if (!userId || !phone) {
      return res.status(422).json({ error: "userId và phone là bắt buộc!" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(422).json({ error: "Invalid userId!" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    // Kiểm tra số điện thoại đã tồn tại
    const existingPhone = await User.findOne({ phone, _id: { $ne: userId } });
    if (existingPhone) {
      return res.status(403).json({ error: "Số điện thoại đã được sử dụng!" });
    }

    const otp = generateToken();
    const usingVerifyService = !!TWILIO_VERIFY_SERVICE_SID;
    let deliveryMethod = "sms";
    let sentToEmail: string | undefined;
    let smsError: string | undefined;

    try {
      if (usingVerifyService) {
        console.log(
          `[sendPhoneOTP] Using Twilio Verify service to send OTP to ${phone}`,
        );
        await sendPhoneVerificationSMS(undefined, phone);
      } else {
        await phoneVerificationToken.findOneAndDelete({ owner: userId });
        await phoneVerificationToken.create({
          owner: userId,
          token: otp,
          phone,
        });
        console.log(`[sendPhoneOTP] Sending SMS to: ${phone}`);
        await sendPhoneVerificationSMS(otp, phone);
      }
      console.log(`[sendPhoneOTP] SMS send attempt completed for ${phone}`);
    } catch (smsErr) {
      console.error("[sendPhoneOTP] SMS sending failed:", smsErr);
      deliveryMethod = "email";
      sentToEmail = user.email;
      smsError = smsErr instanceof Error ? smsErr.message : String(smsErr);
      await phoneVerificationToken.findOneAndDelete({ owner: userId });
      await phoneVerificationToken.create({
        owner: userId,
        token: otp,
        phone,
      });
      try {
        await sendPhoneVerificationOTP(otp, phone, user.name, user.email);
        console.log(
          `[sendPhoneOTP] Fallback email sent successfully to ${user.email}`,
        );
      } catch (emailErr) {
        console.error(
          "[sendPhoneOTP] Fallback email sending also failed:",
          emailErr,
        );
      }
    }

    res.status(200).json({
      message:
        deliveryMethod === "sms"
          ? "Mã OTP đã được gửi tới điện thoại của bạn."
          : "Mã OTP đã được gửi qua email vì SMS không khả dụng.",
      phone: phone.slice(-2).padStart(phone.length, "*"),
      debug: {
        deliveryMethod,
        sentToEmail,
        smsError,
      },
    });
  } catch (error) {
    console.error("[sendPhoneOTP] error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
};

// Xác minh mã OTP điện thoại
export const verifyPhoneOTP: RequestHandler = async (req, res) => {
  try {
    const { token, userId, phone } = req.body;

    if (!token || !userId || !phone) {
      return res
        .status(422)
        .json({ error: "token, userId và phone là bắt buộc!" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(422).json({ error: "Invalid userId!" });
    }

    const useVerifyService = !!TWILIO_VERIFY_SERVICE_SID;
    let isVerified = false;
    let verificationToken;

    if (useVerifyService) {
      try {
        const verificationCheck = await verifyPhoneVerificationCode(
          phone,
          token,
        );
        if (verificationCheck.status === "approved") {
          isVerified = true;
          console.log(`[verifyPhoneOTP] Twilio Verify approved for ${phone}`);
        } else {
          console.warn(
            `[verifyPhoneOTP] Twilio Verify status=${verificationCheck.status}`,
          );
        }
      } catch (verifyErr) {
        console.warn(
          "[verifyPhoneOTP] Twilio verification failed, falling back to DB lookup:",
          verifyErr,
        );
      }
    }

    if (!isVerified) {
      verificationToken = await phoneVerificationToken.findOne({
        owner: userId,
      });

      if (!verificationToken) {
        console.warn(`[verifyPhoneOTP] Token not found for userId: ${userId}`);
        console.warn(
          `[verifyPhoneOTP] Hint: Did you call /send-phone-otp first?`,
        );
        return res.status(403).json({
          error: "Invalid token! (not found in DB)",
          hint: "Make sure you called /auth/send-phone-otp first to generate an OTP",
        });
      }

      const matched = await verificationToken.compareToken(token);
      if (!matched) {
        console.warn(`[verifyPhoneOTP] Token mismatch for userId: ${userId}`);
        return res
          .status(403)
          .json({ error: "Invalid token! (token mismatch)" });
      }

      // Kiểm tra số điện thoại khớp
      if (verificationToken.phone !== phone) {
        console.warn(
          `[verifyPhoneOTP] Phone mismatch. DB: ${verificationToken.phone}, Received: ${phone}`,
        );
        return res.status(403).json({
          error: "Invalid phone number!",
          dbPhone: verificationToken.phone,
          receivedPhone: phone,
        });
      }

      await phoneVerificationToken.findByIdAndDelete(verificationToken._id);
    } else {
      await phoneVerificationToken.findOneAndDelete({ owner: userId });
    }

    await User.findByIdAndUpdate(userId, {
      phone,
      phoneVerified: true,
    });

    res
      .status(200)
      .json({ message: "Điện thoại đã được xác minh thành công!" });
  } catch (error) {
    console.error("[verifyPhoneOTP] error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
};

// Gửi lại mã OTP điện thoại
export const sendRePhoneOTP: RequestHandler = async (req, res) => {
  try {
    const { userId, phone } = req.body;

    if (!userId || !phone) {
      return res.status(422).json({ error: "userId và phone là bắt buộc!" });
    }

    if (!isValidObjectId(userId)) {
      return res.status(422).json({ error: "Invalid userId!" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    const otp = generateToken();
    const usingVerifyService = !!TWILIO_VERIFY_SERVICE_SID;
    let deliveryMethod = "sms";
    let smsError: string | undefined;

    try {
      if (usingVerifyService) {
        console.log(
          `[sendRePhoneOTP] Using Twilio Verify service to send OTP to ${phone}`,
        );
        await sendPhoneVerificationSMS(undefined, phone);
      } else {
        await phoneVerificationToken.findOneAndDelete({ owner: userId });
        await phoneVerificationToken.create({
          owner: userId,
          token: otp,
          phone,
        });
        await sendPhoneVerificationSMS(otp, phone);
      }
      console.log(`[sendRePhoneOTP] SMS send attempt completed for ${phone}`);
    } catch (smsErr) {
      console.error("[sendRePhoneOTP] SMS sending failed:", smsErr);
      deliveryMethod = "email";
      smsError = smsErr instanceof Error ? smsErr.message : String(smsErr);
      await phoneVerificationToken.findOneAndDelete({ owner: userId });
      await phoneVerificationToken.create({
        owner: userId,
        token: otp,
        phone,
      });
      try {
        await sendPhoneVerificationOTP(otp, phone, user.name, user.email);
        console.log(
          `[sendRePhoneOTP] Fallback email sent successfully to ${user.email}`,
        );
      } catch (emailErr) {
        console.error(
          "[sendRePhoneOTP] Fallback email sending also failed:",
          emailErr,
        );
      }
    }

    res.status(200).json({
      message:
        deliveryMethod === "sms"
          ? "Mã OTP mới đã được gửi tới điện thoại của bạn."
          : "Mã OTP mới đã được gửi qua email vì SMS không khả dụng.",
      phone: phone.slice(-2).padStart(phone.length, "*"),
      debug: {
        deliveryMethod,
        smsError,
      },
    });
  } catch (error) {
    console.error("[sendRePhoneOTP] error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: (error as Error).message,
    });
  }
};
