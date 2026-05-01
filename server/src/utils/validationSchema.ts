import * as yup from "yup";

export const CreateUserSchema = yup.object().shape({
    name: yup.string().trim().required("Name is missing").min(3, "Name is too short").max(255, "Name is too long"),
    email: yup.string().trim().required("Email is missing").email("Email is invalid"),
    password: yup.string().trim().required("Password is missing").min(8, 'Password is too short').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character"
    )
});

