import { Request } from "express";
import { File } from "formidable";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: any;
        name: string;
        email: string;
        verified: boolean;
        avatar?: string;
        followers: number;
        following: number;
      };
      files?: { [key: string]: File };
      token: string;
    }
  }
}

export interface CreateUser extends Request {
  body: {
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
