const express = require("express");
const routes = require("./routes");
const cors = require('cors');
const errorMiddleware = require("./middlewares/error.middleware");
const path = require("node:path");
const fs = require("node:fs");


const app = express();
const uploadsPath = path.join(__dirname, "../uploads");
const frontendDistPath = path.join(__dirname, "../frontend/dist");

app.use(express.json());
app.use(cors({
    origin: '*', // Allow all origins for development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use("/uploads", express.static(uploadsPath));
app.use("/api", routes);

if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
        res.sendFile(path.join(frontendDistPath, "index.html"));
    });
} else {
    app.get("/", (req, res) => {
        res.status(200).send("Frontend build not found. Run `npm run build` in ./frontend.");
    });
}

app.use(errorMiddleware);

module.exports = app;
