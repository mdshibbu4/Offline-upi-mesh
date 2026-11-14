import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import OfflinePacket from "../models/OfflinePacket.js";

export async function stats(req, res, next) {
  try {
    const [users, transactions, settled, rejected, vol, recent] = await Promise.all([
      User.countDocuments(),
      Transaction.countDocuments(),
      OfflinePacket.countDocuments({ status: "SETTLED" }),
      OfflinePacket.countDocuments({ status: "REJECTED" }),
      Transaction.aggregate([{ $match: { status: "SUCCESS" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      OfflinePacket.find().sort({ createdAt: -1 }).limit(20),
    ]);
    res.json({
      users, transactions,
      offlineSettled: settled, offlineRejected: rejected,
      volume: vol[0]?.total || 0,
      recentPackets: recent.map((p) => ({
        packetId: p.packetId, from: p.senderUpiId, to: p.receiverUpiId,
        amount: p.amount, status: p.status, reason: p.reason, at: p.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}
