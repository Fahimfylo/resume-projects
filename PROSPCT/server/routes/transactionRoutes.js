const express = require("express");
const transactionController = require("../controllers/transactionController");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();


router.get("/", adminMiddleware, transactionController.getAllTransactions);
router.get("/:transactionId", adminMiddleware, transactionController.getTransactionById);
router.get("/find/search", adminMiddleware, transactionController.searchTransactions);
router.get("/countTotalTransactions", adminMiddleware, transactionController.countTotalTransactions);
router.post("/add", adminMiddleware, transactionController.addTransaction);
router.put("/update/:transactionId", adminMiddleware, transactionController.updateTransaction);
router.delete("/delete/:transactionId", adminMiddleware, transactionController.deleteTransaction);
router.post("/delete", adminMiddleware, transactionController.deleteAllTransactions);


module.exports = router;
