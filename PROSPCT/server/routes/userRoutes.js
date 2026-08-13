const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { imageUpload } = require("../config/multerConfig");

const router = express.Router();

router.get("/me", authMiddleware, userController.getCurrentUser);
router.get("/", adminMiddleware, userController.getAllUsers);
router.get("/countTotalUsers", adminMiddleware, userController.countTotalUsers);
router.get("/search", adminMiddleware, userController.getUserBySearch);
router.get("/:userId", adminMiddleware, userController.getUserById);
router.post("/addUser", adminMiddleware, userController.addUser);
router.post("/delete", adminMiddleware, userController.deleteAllUsers);
router.delete("/delete/:userId", adminMiddleware, userController.deleteUser);
router.put("/update/:userId", adminMiddleware, userController.updateUser);
router.put("/update", adminMiddleware, userController.updateUserWithField);
router.post(
  "/upload-profile-picture/:userId",
  authMiddleware,
  imageUpload.single("photo"),
  userController.uploadProfilePicture,
);
router.patch("/:userId/isBlocked", adminMiddleware, userController.toggleIsBlocked);




module.exports = router;
