const { imageUploadUtil, upload } = require("../../helpers/cloudinary");
const Product = require("../../models/Product");

// add a new product
const addProduct = async (req, res) => {
  try {
    let imageUrl = "";
    if (req.file) {
      const result = await imageUploadUtil(req.file);
      imageUrl = result.secure_url;
    }

    const {
      title,
      description,
      category,
      brand,
      price,
      salePrice,
      totalStock,
      averageReview,
    } = req.body;

    const newProduct = new Product({
      image: imageUrl,
      title,
      description,
      category,
      brand,
      price,
      salePrice,
      totalStock,
      averageReview,
    });

    await newProduct.save();

    res.status(201).json({
      success: true,
      data: newProduct,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error occurred",
    });
  }
};

// fetch all products
const fetchAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error occurred",
    });
  }
};

// edit a product
const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    // handle optional image upload
    if (req.file) {
      try {
        const result = await imageUploadUtil(req.file);
        product.image = result.secure_url;
      } catch (imgErr) {
        console.error("Cloudinary upload error:", imgErr);
        return res.status(500).json({
          success: false,
          message: "Image upload failed",
        });
      }
    }

    const {
      title,
      description,
      category,
      brand,
      price,
      salePrice,
      totalStock,
      averageReview,
    } = req.body;

    if (title !== undefined) product.title = title;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (brand !== undefined) product.brand = brand;
    if (price !== undefined) product.price = price;
    if (salePrice !== undefined) product.salePrice = salePrice;
    if (totalStock !== undefined) product.totalStock = totalStock;
    if (averageReview !== undefined) product.averageReview = averageReview;

    await product.save();

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Edit product error:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred",
    });
  }
};

// delete a product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error occurred",
    });
  }
};

module.exports = {
  addProduct,
  fetchAllProducts,
  editProduct,
  deleteProduct,
};
