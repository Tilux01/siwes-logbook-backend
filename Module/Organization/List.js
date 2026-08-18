const connection = require("../../sqlConnection");

const organizationList = async (req, res) => {
    try {
        const command = 'SELECT id, Name, Location, Email_Address, Contact_Address FROM Organization_Table'
        const [query] = await connection.execute(command)
        res.status(200).json({ message: query, status: "OK" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error listing organizations" })
    }
}

module.exports = organizationList
