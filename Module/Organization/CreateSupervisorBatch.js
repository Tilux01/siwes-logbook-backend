const connection = require("../../sqlConnection");

const CreateSupervisorBatch = async (req, res) => {
    console.log("CreateSupervisorBatch Organization", req.body);
    const { supervisors, Organization_Id, Organization_Mail } = req.body;
    
    if (!supervisors || !Array.isArray(supervisors) || supervisors.length === 0) {
        return res.status(400).json({ message: "Please provide an array of supervisors" });
    }
    if (!Organization_Id || !Organization_Mail) {
        return res.status(400).json({ message: "Missing Organization_Id or Organization_Mail parameter" });
    }

    try {
        const values = supervisors.map(sup => [
            Organization_Id,
            Organization_Mail,
            sup.Full_Name,
            sup.Email_Address,
            sup.department || null,
            sup.Contact_Adress || null,
            sup.capacity || 5,
            sup.focus_areas || null
        ]);
        
        const command = 'INSERT INTO Organization_Supervisor (Organization_Id, Organization_Mail, Full_Name, Email_Address, department, Contact_Adress, capacity, focus_areas) VALUES ?';
        const [result] = await connection.query(command, [values]);
        
        res.status(200).json({ message: "Successfully added " + result.affectedRows + " organization supervisors", count: result.affectedRows });
    } catch (error) {
        console.error("Batch Add Error:", error);
        if (error?.sqlMessage?.includes("Duplicate entry")) {
            return res.status(501).json({ message: "One or more supervisor email addresses are already registered" });
        }
        res.status(501).json({ message: "Error adding supervisors in bulk: " + error.message });
    }
}

module.exports = CreateSupervisorBatch;
