import mongoose from "mongoose";

// One document per offline payment packet that reached the server.
// The unique packetId is what stops double-spending / replay.
const schema = new mongoose.Schema(
  {
    packetId: { type: String, required: true, unique: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderUpiId: String,
    receiverUpiId: String,
    amount: { type: Number, required: true },
    createdAtClient: Date,
    status: { type: String, enum: ["PROCESSING", "SETTLED", "REJECTED"], default: "PROCESSING" },
    reason: String,
  },
  { timestamps: true }
);

export default mongoose.model("OfflinePacket", schema);
