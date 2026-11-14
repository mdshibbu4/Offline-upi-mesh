import mongoose from "mongoose";

// balance is whole rupees (integer). Stage 3 updates it only with atomic $inc.
const walletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);
