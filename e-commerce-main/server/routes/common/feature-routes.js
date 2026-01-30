const express = require("express");
const router = express.Router();

const { upload } = require("../../helpers/cloudinary");
const {
  addFeatureImage,
  getFeatureImages,
} = require("../../controllers/common/feature-controller");

// Multer field name must match "image"
router.post("/add", upload.single("image"), addFeatureImage);
router.get("/get", getFeatureImages);

module.exports = router;
