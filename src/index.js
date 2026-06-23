// require("dotenv").config();
import dotenv from "dotenv";
import express from "express";
import connectToDb from "./db/db.js";

dotenv.config({
    path : ".env"
});



connectToDb();


