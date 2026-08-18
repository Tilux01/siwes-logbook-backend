const mysql = require("mysql2/promise")
const fs = require("fs")

const connectSql = async () => {
    console.log("avien");
    try {
        const connection = await mysql.createPool({
            host: "siwes-lgobook-siweslogbook.i.aivencloud.com",
            port: 19607,
            user: "avnadmin",
            password: "AVNS_48LZAEyOhELKKBLTPKz",
            database: "defaultdb",
            ssl: {
                ca: fs.readFileSync('./ca.pem'),
                rejectUnauthorized: true
            }
        }
        )
        return connection
    } catch (error) {
        console.log(error);

    }
}
module.exports = connectSql