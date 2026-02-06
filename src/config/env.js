const {resolve} = require("node:path");
require("dotenv").config({
    path: resolve(__dirname, "../../.env")
});

module.exports = {
    MONGO_URI: process.env.MONGO_URI,
    MONGO_DB_NAME: process.env.MONGO_DB_NAME
};
