const connection = require("../../sqlConnection");

const CreateStudentBatch = async (req, res) => {
    console.log("CreateStudentBatch", req.body);
    const { students, Instituition_Id, Instituition_Mail } = req.body;
    
    if (!students || !Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ message: "Please provide an array of students" });
    }
    if (!Instituition_Id || !Instituition_Mail) {
        return res.status(400).json({ message: "Missing Instituition_Id or Instituition_Mail parameter" });
    }

    try {
        // Fetch all supervisors for this institution
        const [supervisors] = await connection.query("SELECT id, Email_Address FROM School_Supervisor WHERE Instituition_Id = ?", [Instituition_Id]);
        
        const supervisorMap = {};
        supervisors.forEach(sup => {
            supervisorMap[sup.Email_Address.toLowerCase()] = sup.id;
        });

        // Validate all students
        for (let i = 0; i < students.length; i++) {
            const st = students[i];
            if (!st.Supervisor_Email) {
                return res.status(400).json({ message: `Student '${st.Full_Name}' is missing a Supervisor Email.` });
            }
            const supId = supervisorMap[st.Supervisor_Email.toLowerCase()];
            if (!supId) {
                return res.status(400).json({ message: `The supervisor email '${st.Supervisor_Email}' provided for student '${st.Full_Name}' is not registered to this institution.` });
            }
            st.School_Supervisor_Id = supId;
        }

        const values = students.map(st => [
            st.Full_Name,
            Instituition_Id,
            st.School_Supervisor_Id,
            st.email_address,
            st.Matriculation_No,
            st.department,
            Instituition_Mail,
            st.Start_Date,
            st.End_Date
        ]);
        
        const command = 'INSERT INTO Student_Table (Full_Name, Instituition_Id, School_Supervisor_Id, email_address, Matriculation_No, department, Instituition_Mail, Start_Date, End_Date) VALUES ?';
        const [result] = await connection.query(command, [values]);
        
        res.status(200).json({ message: "Successfully added " + result.affectedRows + " students", count: result.affectedRows });
    } catch (error) {
        console.error("Batch Add Error:", error);
        if (error?.sqlMessage?.includes("Duplicate entry")) {
            return res.status(501).json({ message: "One or more email addresses or matric numbers are already registered" });
        }
        res.status(501).json({ message: "Error adding students in bulk: " + error.message });
    }
}

module.exports = CreateStudentBatch
