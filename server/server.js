import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET missing in .env");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
connectDB();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
