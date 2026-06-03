"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const search_1 = require("../controllers/search");
const router = (0, express_1.Router)();
router.get("/", auth_1.mustAuth, search_1.search);
exports.default = router;
