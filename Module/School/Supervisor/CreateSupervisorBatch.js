const connection = require("../../../sqlConnection");

const CreateSupervisorBatch = async (req, res) => {
    console.log("CreateSupervisorBatch", req.body);
    const { supervisors, Instituition_Id } = req.body;
    
    if (!supervisors || !Array.isArray(supervisors) || supervisors.length === 0) {
        return res.status(400).json({ message: "Please provide an array of supervisors" });
    }
    if (!Instituition_Id) {
        return res.status(400).json({ message: "Missing Instituition_Id parameter" });
    }

    try {
        const values = supervisors.map(sup => [
            sup.Full_Name,
            Instituition_Id,
            sup.Email_Address,
            sup.Department
        ]);
        
        const command = 'INSERT INTO School_Supervisor (Full_Name, Instituition_Id, Email_Address, Department) VALUES ?';
        const [result] = await connection.query(command, [values]);
        
        res.status(200).json({ message: "Successfully added " + result.affectedRows + " supervisors", count: result.affectedRows });
    } catch (error) {
        console.error("Batch Add Error:", error);
        if (error?.sqlMessage?.includes("Duplicate entry")) {
            return res.status(501).json({ message: "One or more email addresses are already registered" });
        }
        res.status(501).json({ message: "Error adding supervisors in bulk: " + error.message });
    }
}

module.exports = CreateSupervisorBatch
