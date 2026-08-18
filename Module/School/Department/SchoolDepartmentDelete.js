const connection = require("../../../sqlConnection");

const SchoolDepartmentDelete = async (req, res) => {
    console.log("SchoolDepartmentDelete", req.body);
    const id = req.body?.id
    if (!id) {
        return res.status(400).json({ message: "Please provide department id" })
    }
    try {
        const command = 'DELETE FROM Department_Table WHERE id=?'
        await connection.execute(command, [id])
        res.status(200).json({ message: "Department deleted successfully", status: "OK" })
    } catch (error) {
        console.log(error);
        res.status(501).json({ message: "Error deleting department" })
    }
}

module.exports = SchoolDepartmentDelete
