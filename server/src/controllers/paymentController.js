import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";

const MAX_AMOUNT = 100000;

export async function sendMoney(req, res, next) {
  try {
    const { receiverUpiId, amount } = req.body;
    const note = typeof req.body.note === "string" ? req.body.note.slice(0, 100) : undefined;
    const amt = Number(amount);

    if (typeof receiverUpiId !== "string" || !receiverUpiId) return res.status(400).json({ message: "Receiver UPI ID is required" });
    if (!Number.isInteger(amt) || amt < 1 || amt > MAX_AMOUNT)
      return res.status(400).json({ message: `Amount must be a whole number from 1 to ${MAX_AMOUNT}` });

    const receiver = await User.findOne({ upiId: receiverUpiId.toLowerCase() });
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });
    if (receiver._id.equals(req.user._id))
      return res.status(400).json({ message: "You cannot send money to yourself" });

    // 1) Atomic debit: the filter and the update happen in ONE database operation,
    //    so two parallel requests can never both spend the same money.
    const debited = await Wallet.findOneAndUpdate(
      { user: req.user._id, balance: { $gte: amt } },
      { $inc: { balance: -amt } },
      { new: true }
    );

    if (!debited) {
      await Transaction.create({
        sender: req.user._id, receiver: receiver._id, amount: amt,
        status: "FAILED", failReason: "Insufficient balance", note,
      });
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // 2) Credit. If this fails, give the money back.
    try {
      await Wallet.updateOne({ user: receiver._id }, { $inc: { balance: amt } });
    } catch (err) {
      await Wallet.updateOne({ user: req.user._id }, { $inc: { balance: amt } });
      throw err;
    }

    const txn = await Transaction.create({
      sender: req.user._id, receiver: receiver._id, amount: amt, status: "SUCCESS", note,
    });
    res.status(201).json({ transaction: { id: txn._id, amount: amt, status: txn.status }, balance: debited.balance });
  } catch (err) {
    next(err);
  }
}

export async function getTransactions(req, res, next) {
  try {
    const me = req.user._id;
    const list = await Transaction.find({ $or: [{ sender: me }, { receiver: me }] })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender receiver", "name upiId");

    res.json({
      transactions: list.map((t) => {
        const sent = t.sender._id.equals(me);
        const other = sent ? t.receiver : t.sender;
        return {
          id: t._id,
          direction: sent ? "SENT" : "RECEIVED",
          counterparty: { name: other.name, upiId: other.upiId },
          amount: t.amount,
          status: t.status,
          mode: t.mode,
          note: t.note,
          failReason: t.failReason,
          createdAt: t.createdAt,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
}
