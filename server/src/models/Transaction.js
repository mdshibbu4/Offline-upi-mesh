import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["SUCCESS", "FAILED"], required: true },
    mode: { type: String, enum: ["ONLINE", "OFFLINE"], default: "ONLINE" },
    note: { type: String, trim: true, maxlength: 100 },
    failReason: String,
    // Stage 4/5: unique id of an offline packet. sparse = only enforced when present.
    packetId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
