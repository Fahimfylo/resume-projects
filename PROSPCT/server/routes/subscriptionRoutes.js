const express = require("express");
const subscriptionController = require("../controllers/subscriptionController");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", adminMiddleware, subscriptionController.getAllSubscriptions);
router.get("/countTotalSubscriptions", adminMiddleware, subscriptionController.countTotalSubscriptions);
router.get("/:subscriptionId", adminMiddleware, subscriptionController.getSubscriptionById);
router.get("/search", adminMiddleware, subscriptionController.getSubscriptionsBySearch);
router.post("/addsubscription", adminMiddleware, subscriptionController.addSubscription);
router.delete("/delete/:subscriptionId", adminMiddleware, subscriptionController.deleteSubscription);
router.put("/update/:subscriptionId", adminMiddleware, subscriptionController.updateSubscription);
router.post("/deleteAll", adminMiddleware, subscriptionController.deleteAllSubscriptions);




module.exports = router;
