const { imageUploadUtil } = require("../../helpers/cloudinary");
const Feature = require("../../models/Feature");

const addFeatureImage = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    // Upload to Cloudinary
    const result = await imageUploadUtil(req.file);

    // Save to DB
    const featureImage = new Feature({
      image: result.secure_url,
    });
    await featureImage.save();

    res.status(201).json({
      success: true,
      data: featureImage,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const getFeatureImages = async (req, res) => {
  try {
    const images = await Feature.find({});
    res.status(200).json({
      success: true,
      data: images,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

module.exports = { addFeatureImage, getFeatureImages };
