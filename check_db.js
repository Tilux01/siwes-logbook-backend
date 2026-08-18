const connect = require('./sqlConnection');
async function test() {
    const connection = await connect();
    const [rows] = await connection.execute('SHOW COLUMNS FROM Department_Table');
    console.log(rows.map(r => r.Field));
    process.exit();
}
test();
