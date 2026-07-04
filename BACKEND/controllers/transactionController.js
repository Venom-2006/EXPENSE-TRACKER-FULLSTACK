const Transaction = require("../models/Transaction"); // Adjust path based on your models folder

// @desc    Get all transactions for logged-in user
// @route   GET /api/transactions
const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user._id }).sort({ date: -1 });
        res.status(200).json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a transaction linked to user
// @route   POST /api/transactions
const createTransaction = async (req, res) => {
    try {
        const { title, amount, type, category, paymentMethod, notes } = req.body;
        
        const transaction = await Transaction.create({
            userId: req.user._id,
            title,
            amount,
            type,
            category,
            paymentMethod,
            notes
        });

        res.status(201).json({ success: true, data: transaction });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

        // Check ownership
        if (transaction.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: "User not authorized" });
        }

        await transaction.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getTransactions, createTransaction, deleteTransaction };