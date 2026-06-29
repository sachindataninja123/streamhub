// require("dotenv").config();
import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import connectToDb from "./db/db.js";
import app from "./app.js";

const PORT = process.env.PORT || 8000;

connectToDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
