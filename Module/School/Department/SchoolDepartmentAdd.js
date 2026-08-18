const connection = require("../../../sqlConnection");

const SchoolDepartmentAdd = async (req, res) => {
    console.log("SchoolDepartmentAdd", req.body);
    const departmentName = req.body?.departmentName
    const instituitionId = req.body?.instituitionId
    const facultyName = req.body?.facultyName
    const HODName = req.body?.HODName
    if (!departmentName) return res.status(400).json({ message: "Missing departmentName parameter" })
    if (!instituitionId) return res.status(400).json({ message: "Missing instituitionId parameter (schoolCred.id might be empty)" })
    if (!facultyName) return res.status(400).json({ message: "Missing facultyName parameter" })
    if (!HODName) return res.status(400).json({ message: "Missing HODName parameter" })
    try {
        const command = 'INSERT INTO   Department_Table (instituition_id,department_name, faculty_name, Hod_name) VALUES (?,?,?,?)'
        const values = [instituitionId, departmentName, facultyName, HODName]
        const [result] = await connection.execute(command, values)
        res.status(200).json({ message: result?.insertId})
    } catch (error) {
        console.log(error);
        res.status(501).json({ message: "Error adding department" })
    }
}

module.exports = SchoolDepartmentAdd