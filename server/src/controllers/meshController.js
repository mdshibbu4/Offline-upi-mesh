import MeshDevice from "../models/MeshDevice.js";

const DEFAULTS = [
  { key: "A", label: "Phone A", order: 0, internet: false },
  { key: "B", label: "Phone B", order: 1, internet: false },
  { key: "C", label: "Phone C", order: 2, internet: false },
  { key: "BRIDGE", label: "Bridge", order: 3, internet: true },
];

export async function getDevices(req, res, next) {
  try {
    if ((await MeshDevice.countDocuments()) === 0) await MeshDevice.insertMany(DEFAULTS);
    res.json({ devices: await MeshDevice.find().sort("order") });
  } catch (err) {
    next(err);
  }
}

export async function setInternet(req, res, next) {
  try {
    if (typeof req.body.internet !== "boolean") return res.status(400).json({ message: "internet must be true/false" });
    const d = await MeshDevice.findOneAndUpdate({ key: String(req.params.key) }, { internet: req.body.internet }, { new: true });
    if (!d) return res.status(404).json({ message: "Device not found" });
    res.json({ device: d });
  } catch (err) {
    next(err);
  }
}
