const router = require("express").Router();
const controller = require("./users.controller");
const auth = require("../../middlewares/auth.middleware");
const { requireRoles } = require("../../middlewares/role.middleware");

router.get("/profile", auth, controller.getProfile);
router.put("/profile", auth, controller.updateProfile);
router.put("/profile/password", auth, controller.changePassword);
router.get("/:id", auth, requireRoles("admin"), controller.getUserById);

module.exports = router;
