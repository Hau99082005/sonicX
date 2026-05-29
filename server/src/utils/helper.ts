import { UserDocument } from "#/models/User";

export const generateToken = (length = 6) => {
    let otp = "";
    for (let i = 0; i < length; i++) {
        const digit = Math.floor(Math.random() * 10);
        otp += digit;
    }
    return otp;
}

export const formatProfile = (user: UserDocument) => {
    return {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        verified: user.verified,
        avatar: user.avatar?.url,
        is_online: user.is_online,
        last_seen: user.last_seen,
        show_online_status: user.show_online_status,
        phone: user.phone,
        bio: user.bio,
    };
}