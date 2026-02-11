const express = require("express");
const routes = require("./routes");
const cors = require('cors');
const errorMiddleware = require("./middlewares/error.middleware");
const path = require("node:path");


const app = express();

app.use(express.json());
app.use(cors({
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.static(path.join(__dirname, "../public")));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});
app.use("/api", routes);
app.use(errorMiddleware);

module.exports = app;
