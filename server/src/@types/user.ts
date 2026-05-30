import { Request } from "express";
import { File } from "formidable";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: any;
        username: string;
        name: string;
        email: string;
        verified: boolean;
        role: "user" | "admin";
        avatar?: string;
        is_online: boolean;
        last_seen?: Date;
        bio?: string;
        phone?: string;
        show_online_status: boolean;
      };
      files?: { [key: string]: File };
      token: string;
    }
  }
}

export interface CreateUser extends Request {
  body: {
    username: string;
    name: string;
    email: string;
    password: string;
  };
}

export interface VerifyEmailRequest extends Request {
  body: {
    userId: string;
    token: string;
  };
}

export interface SendPhoneOTPRequest extends Request {
  body: {
    userId: string;
    phone: string;
  };
}

export interface VerifyPhoneOTPRequest extends Request {
  body: {
    userId: string;
    token: string;
    phone: string;
  };
}
