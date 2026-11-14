import mongoose from "mongoose";

const schema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  order: { type: Number, required: true },
  internet: { type: Boolean, default: false },
});

export default mongoose.model("MeshDevice", schema);
