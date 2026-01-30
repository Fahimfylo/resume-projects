const express = require("express");
const router = express.Router();

const {
  addProduct,
  editProduct,
  fetchAllProducts,
  deleteProduct,
} = require("../../controllers/admin/products-controller");

const { upload } = require("../../helpers/cloudinary");

// Add product with image upload
router.post("/add", upload.single("image"), addProduct);

// Edit product with optional image
router.put("/edit/:id", upload.single("image"), editProduct);

// Delete product
router.delete("/delete/:id", deleteProduct);

// Fetch all products
router.get("/get", fetchAllProducts);

module.exports = router;
