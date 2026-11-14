import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";

const STARTING_BALANCE = 5000; // demo money
const isStr = (v) => typeof v === "string";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

const publicUser = (u) => ({
  id: u._id, name: u.name, email: u.email, upiId: u.upiId, role: u.role, hasKey: !!u.publicKey,
});

async function makeUpiId(name) {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
  for (let i = 0; i < 5; i++) {
    const id = `${base}${Math.floor(100 + Math.random() * 900)}@meshpay`;
    if (!(await User.exists({ upiId: id }))) return id;
  }
  throw new Error("Could not generate UPI ID, try again");
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    // typeof checks also block NoSQL injection like { "email": { "$ne": null } }
    if (![name, email, password].every(isStr) || !name.trim() || !email.trim() || !password)
      return res.status(400).json({ message: "Name, email and password are required" });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "Invalid email" });
    if (password.length < 6 || password.length > 72)
      return res.status(400).json({ message: "Password must be 6 to 72 characters" });

    if (await User.exists({ email: email.toLowerCase() }))
      return res.status(409).json({ message: "Email already registered" });

    const role = process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase() ? "admin" : "user";
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role, upiId: await makeUpiId(name) });
    try {
      await Wallet.create({ user: user._id, balance: STARTING_BALANCE });
    } catch (e) {
      await User.deleteOne({ _id: user._id });
      throw e;
    }
    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!isStr(email) || !isStr(password) || !email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ message: "Invalid email or password" });

    res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export const me = (req, res) => res.json({ user: publicUser(req.user) });
