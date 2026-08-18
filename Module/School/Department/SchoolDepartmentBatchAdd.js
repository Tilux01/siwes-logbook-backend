const connect = require("../../../sqlConnection")
let connection
connect()
    .then((output) => {
        connection = output
    })
    .catch((error) => {
        console.log(error);
    })

const SchoolDepartmentBatchAdd = async (req, res) => {
    console.log("SchoolDepartmentBatchAdd", req.body);
    const { departments, instituitionId } = req.body;
    
    if (!departments || !Array.isArray(departments) || departments.length === 0) {
        return res.status(400).json({ message: "Please provide an array of departments" });
    }
    if (!instituitionId) {
        return res.status(400).json({ message: "Missing instituitionId parameter" });
    }

    try {
        // Bulk insert requires an array of arrays
        const values = departments.map(dept => [
            instituitionId, 
            dept.departmentName, 
            dept.facultyName || "Engineering", 
            dept.HODName || ""
        ]);
        
        const command = 'INSERT INTO Department_Table (instituition_id, department_name, faculty_name, Hod_name) VALUES ?';
        const [result] = await connection.query(command, [values]);
        
        res.status(200).json({ message: "Successfully added " + result.affectedRows + " departments", count: result.affectedRows });
    } catch (error) {
        console.error("Batch Add Error:", error);
        res.status(501).json({ message: "Error adding departments in bulk: " + error.message });
    }
}

module.exports = SchoolDepartmentBatchAdd
