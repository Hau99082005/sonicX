import * as yup from "yup";
import { isValidObjectId } from "mongoose";

export const CreateUserSchema = yup.object().shape({
    name: yup.string().trim().required("Name is missing").min(3, "Name is too short").max(255, "Name is too long"),
    email: yup.string().trim().required("Email is missing").email("Email is invalid"),
    password: yup.string().trim().required("Password is missing").min(8, 'Password is too short').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character"
    )
});

export const TokenAndIDValidation = yup.object()
    .shape({
        token: yup.string().trim().required("Invalid token!"),
        userId: yup.string().transform(function (value) {
            if (this.isType(value) && isValidObjectId(value)) {
                return value;
            } else {
                return "";
            }
        }).required("Invalid userId!"),
    })


export const updatedPasswordSchema = yup.object().shape({
    token: yup.string().trim().required("Invalid token!"),
    userId: yup.string().transform(function (value) {
        if (this.isType(value) && isValidObjectId(value)) {
            return value;
        } else {
            return "";
        }
    }).required("Invalid userId!"),
    password: yup.string().trim().required("Password is missing").min(8, 'Password is too short').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character"
    )
})

export const SignInEmailValidationSchema = yup.object().shape({
    email: yup.string().trim().required("Email is missing").email('Invalid email id!'),
    password: yup.string().trim().required("Password is missing"),


})
