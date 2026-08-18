const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

// Create the connection pool once
const pool = mysql.createPool({
    host: "siwes-lgobook-siweslogbook.i.aivencloud.com",
    port: 19607,
    user: "avnadmin",
    password: "AVNS_48LZAEyOhELKKBLTPKz",
    database: "defaultdb",
    ssl: {
        ca: fs.readFileSync(path.join(__dirname, 'ca.pem')),
        rejectUnauthorized: true
    }
});

// Optional: test the pool connection on startup
pool.getConnection()
    .then((conn) => {
        console.log("Aiven connection pool created and connected successfully");
        conn.release();
    })
    .catch((error) => {
        console.error("Error connecting to Aiven:", error);
    });

module.exports = pool;