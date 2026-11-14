import crypto from "crypto";

// Stores the user's PUBLIC key once. The server never sees the private key.
export async function setPublicKey(req, res, next) {
  try {
    const k = req.body?.publicKey;
    if (!k || k.kty !== "EC" || k.crv !== "P-256" || typeof k.x !== "string" || typeof k.y !== "string")
      return res.status(400).json({ message: "Invalid public key" });
    if (req.user.publicKey) return res.status(409).json({ message: "Key already registered" });

    const jwk = { kty: "EC", crv: "P-256", x: k.x, y: k.y };
    try {
      crypto.createPublicKey({ key: jwk, format: "jwk" });
    } catch {
      return res.status(400).json({ message: "Invalid public key" });
    }
    req.user.publicKey = jwk;
    await req.user.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
