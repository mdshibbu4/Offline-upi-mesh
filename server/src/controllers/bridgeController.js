import crypto from "crypto";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";
import OfflinePacket from "../models/OfflinePacket.js";

const OFFLINE_LIMIT = 2000; // max per offline packet
const MAX_AGE_MS = 7 * 24 * 3600 * 1000;
const reject = (p, reason) => ({ packetId: p?.packetId, status: "REJECTED", reason });

// The exact text the sender's device signed
const messageOf = (p) => `${p.packetId}|${p.senderUpiId}|${p.receiverUpiId}|${p.amount}|${p.createdAt}`;

function signatureValid(jwk, message, sigB64) {
  try {
    const key = crypto.createPublicKey({ key: jwk, format: "jwk" });
    return crypto.verify("sha256", Buffer.from(message), { key, dsaEncoding: "ieee-p1363" }, Buffer.from(sigB64, "base64"));
  } catch {
    return false;
  }
}

async function settle(p) {
  const strs = ["packetId", "senderUpiId", "receiverUpiId", "signature", "createdAt"];
  if (!p || !strs.every((k) => typeof p[k] === "string") || !Number.isInteger(p.amount) || p.amount < 1 || p.amount > OFFLINE_LIMIT)
    return reject(p, "Malformed packet");

  const sender = await User.findOne({ upiId: p.senderUpiId.toLowerCase() });
  if (!sender || !sender.publicKey) return reject(p, "Unknown sender");

  // 1) Authenticity: was this packet really signed by the sender's device, unmodified?
  if (!signatureValid(sender.publicKey, messageOf(p), p.signature))
    return reject(p, "Invalid signature (packet was tampered with or forged)");
  // (Invalid packets are NOT stored, so an attacker cannot "burn" someone's packetId.)

  const t = Date.parse(p.createdAt);
  if (isNaN(t) || Date.now() - t > MAX_AGE_MS || t > Date.now() + 5 * 60 * 1000)
    return reject(p, "Packet expired or has an invalid time");

  const receiver = await User.findOne({ upiId: p.receiverUpiId.toLowerCase() });
  if (!receiver) return reject(p, "Receiver not found");
  if (receiver._id.equals(sender._id)) return reject(p, "Cannot send to yourself");

  // 2) Idempotency: claim the packetId FIRST. The unique index guarantees only one
  //    request can ever win, even if the same packet arrives via two bridges at once.
  let rec;
  try {
    rec = await OfflinePacket.create({
      packetId: p.packetId, sender: sender._id, receiver: receiver._id,
      senderUpiId: sender.upiId, receiverUpiId: receiver.upiId,
      amount: p.amount, createdAtClient: new Date(t), status: "PROCESSING",
    });
  } catch (e) {
    if (e.code === 11000) return reject(p, "Duplicate packet: already processed (double-spend blocked)");
    throw e;
  }
  const finish = async (status, reason) => {
    rec.status = status; rec.reason = reason; await rec.save();
    return { packetId: p.packetId, status, reason };
  };

  // 3) Real balance check happens now, on the server (atomic debit)
  const debited = await Wallet.findOneAndUpdate(
    { user: sender._id, balance: { $gte: p.amount } },
    { $inc: { balance: -p.amount } }
  );
  if (!debited) {
    await Transaction.create({ sender: sender._id, receiver: receiver._id, amount: p.amount, status: "FAILED", mode: "OFFLINE", failReason: "Insufficient balance" });
    return finish("REJECTED", "Insufficient balance");
  }
  try {
    await Wallet.updateOne({ user: receiver._id }, { $inc: { balance: p.amount } });
    await Transaction.create({ sender: sender._id, receiver: receiver._id, amount: p.amount, status: "SUCCESS", mode: "OFFLINE", packetId: p.packetId });
  } catch {
    await Wallet.updateOne({ user: sender._id }, { $inc: { balance: p.amount } }); // refund
    return finish("REJECTED", "Server error, money refunded");
  }
  return finish("SETTLED");
}

export async function sync(req, res, next) {
  try {
    const { packets } = req.body;
    if (!Array.isArray(packets) || packets.length === 0 || packets.length > 50)
      return res.status(400).json({ message: "Send 1 to 50 packets" });
    const results = [];
    for (const p of packets) results.push(await settle(p));
    res.json({ results });
  } catch (err) {
    next(err);
  }
}
