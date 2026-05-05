import { createAudio, deleteAudio, getAudio, updateAudio } from "#/controllers/audio";
import { isVerified, mustAuth } from "#/middleware/auth";
import fileParser from "#/middleware/fileParser";
import { validate } from "#/middleware/validator";
import { AudioValidationSchema } from "#/utils/validationSchema";
import { Router } from "express";

const router = Router();

router.post("/create",
    mustAuth,
    isVerified,
    fileParser,
    validate(AudioValidationSchema),
    createAudio);

router.patch("/:audioId",
    mustAuth,
    isVerified,
    fileParser,
    validate(AudioValidationSchema),
    updateAudio
);

router.get("/",
    mustAuth,
    getAudio
);

router.delete("/:audioId",
    mustAuth,
    isVerified,
    deleteAudio
);
export default router;