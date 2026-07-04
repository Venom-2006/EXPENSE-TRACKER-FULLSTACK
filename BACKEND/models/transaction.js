const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Transaction must belong to a user"],
        },
        title: {
            type: String,
            required: [true, "Please add a title"],
            trim: true,
            maxlength: [50, "Title cannot be more than 50 characters"],
        },
        amount: {
            type: Number,
            required: [true, "Please add an amount"],
            min: [0.01, "Amount must be greater than 0"],
        },
        type: {
            type: String,
            required: [true, "Please specify type"],
            enum: {
                values: ["income", "expense"],
                message: "{VALUE} is not a valid transaction type",
            },
        },
        category: {
            type: String,
            required: [true, "Please specify a category"],
            trim: true,
        },
        paymentMethod: {
            type: String,
            required: [true, "Please specify payment method"],
            enum: ["Cash", "Credit Card", "Debit Card", "Bank Transfer"],
            default: "Cash",
        },
        date: {
            type: Date,
            required: [true, "Please add a date"],
            default: Date.now,
        },
        notes: {
            type: String,
            maxlength: [200, "Notes cannot be more than 200 characters"],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Transaction", transactionSchema);