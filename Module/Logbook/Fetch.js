const connection = require("../../sqlConnection");

const logbookFetch = async (req, res) => {
    console.log("logbookFetch", req.body);
    const student_id = req.body?.student_id
    const school_supervisor_id = req.body?.school_supervisor_id
    const org_supervisor_id = req.body?.org_supervisor_id
    
    if (!student_id && !school_supervisor_id && !org_supervisor_id) {
        return res.status(400).json({ message: "Please provide student_id, school_supervisor_id or org_supervisor_id" })
    }
    
    try {
        // Automatically clean up any legacy fake daily logs created from leave requests
        try {
            await connection.execute("DELETE FROM Logbook_Table WHERE activity_description LIKE 'LEAVE:%'");
        } catch (cleanupErr) {
            // Silently continue if delete query fails or not permitted
        }

        let command = ''
        let values = []
        
        if (student_id) {
            command = "SELECT * FROM Logbook_Table WHERE student_id=? AND (activity_description NOT LIKE 'LEAVE:%' OR activity_description IS NULL) ORDER BY date DESC"
            values = [student_id]
        } else if (school_supervisor_id) {
            command = "SELECT l.*, s.Full_Name as Student_Name, s.Matriculation_No FROM Logbook_Table l JOIN Student_Table s ON l.student_id = s.id WHERE s.School_Supervisor_Id=? AND (l.activity_description NOT LIKE 'LEAVE:%' OR l.activity_description IS NULL) ORDER BY l.date DESC"
            values = [school_supervisor_id]
        } else if (org_supervisor_id) {
            command = "SELECT l.*, s.Full_Name as Student_Name, s.Matriculation_No FROM Logbook_Table l JOIN Student_Table s ON l.student_id = s.id WHERE s.Organization_Supervisor_Id=? AND (l.activity_description NOT LIKE 'LEAVE:%' OR l.activity_description IS NULL) ORDER BY l.date DESC"
            values = [org_supervisor_id]
        }
        
        const [query] = await connection.execute(command, values)
        res.status(200).json({ message: query, status: "OK" })
    } catch (error) {
        console.log(error);
        res.status(501).json({ message: "Error fetching logbook entries" })
    }
}

module.exports = logbookFetch
