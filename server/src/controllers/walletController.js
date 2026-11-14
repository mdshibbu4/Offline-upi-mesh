import Wallet from "../models/Wallet.js";
import User from "../models/User.js";

export async function getWallet(req, res, next) {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    res.json({ balance: wallet.balance });
  } catch (err) {
    next(err);
  }
}

// Used in Stage 3 to find the receiver before sending money
export async function lookupUser(req, res, next) {
  try {
    const user = await User.findOne({ upiId: req.params.upiId.toLowerCase() });
    if (!user) return res.status(404).json({ message: "No user with this UPI ID" });
    res.json({ name: user.name, upiId: user.upiId });
  } catch (err) {
    next(err);
  }
}
