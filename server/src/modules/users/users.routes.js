const router = require("express").Router();
const { authJwt } = require("../../middlewares/authJwt");
const ctrl = require("./users.controller");

router.get("/me", authJwt, ctrl.getMe);
router.patch("/me", authJwt, ctrl.patchMe);

module.exports = router;
