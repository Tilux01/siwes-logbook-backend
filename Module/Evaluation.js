const connection = require("../sqlConnection");

const submitEvaluation = async (req, res) => {
    const { 
        student_id, org_supervisor_id, attendance_score, attitude_score, 
        work_quality_score, independence_score, professionalism_score, 
        communication_score, leadership_score, total_score, final_remarks 
    } = req.body;

    if (!student_id || !org_supervisor_id) {
        return res.status(400).json({ message: "Missing student_id or org_supervisor_id" });
    }

    try {
        // Enforce that org_supervisor_id corresponds to a valid Organization / Industry Supervisor
        const [supervisorRows] = await connection.execute(
            "SELECT id, Full_Name FROM Organization_Supervisor WHERE id = ?",
            [org_supervisor_id]
        );
        if (supervisorRows.length === 0) {
            return res.status(403).json({ 
                message: "Access denied. Only registered industry supervisors can grade final evaluations." 
            });
        }

        // Verify student exists and check assignment
        const [studentRows] = await connection.execute(
            "SELECT id, Organization_Supervisor_Id FROM Student_Table WHERE id = ?",
            [student_id]
        );
        if (studentRows.length === 0) {
            return res.status(404).json({ message: "Student record not found." });
        }

        const student = studentRows[0];
        // If student is explicitly assigned to a specific supervisor, verify it matches
        if (student.Organization_Supervisor_Id && Number(student.Organization_Supervisor_Id) !== Number(org_supervisor_id)) {
            return res.status(403).json({
                message: "Access denied. You are not the assigned industry supervisor for this student."
            });
        }

        // Check if already evaluated
        const [existing] = await connection.execute("SELECT id FROM Student_Evaluation_Table WHERE student_id = ?", [student_id]);
        if (existing.length > 0) {
            // Update
            const command = `UPDATE Student_Evaluation_Table SET 
                attendance_score=?, attitude_score=?, work_quality_score=?, 
                independence_score=?, professionalism_score=?, communication_score=?, 
                leadership_score=?, total_score=?, final_remarks=? WHERE student_id=?`;
            const values = [
                attendance_score, attitude_score, work_quality_score, 
                independence_score, professionalism_score, communication_score, 
                leadership_score, total_score, final_remarks, student_id
            ];
            await connection.execute(command, values);
            return res.status(200).json({ message: "Evaluation updated successfully", status: "OK" });
        } else {
            // Insert
            const command = `INSERT INTO Student_Evaluation_Table 
                (student_id, org_supervisor_id, attendance_score, attitude_score, work_quality_score, 
                independence_score, professionalism_score, communication_score, leadership_score, total_score, final_remarks) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const values = [
                student_id, org_supervisor_id, attendance_score, attitude_score, work_quality_score, 
                independence_score, professionalism_score, communication_score, leadership_score, total_score, final_remarks
            ];
            await connection.execute(command, values);
            return res.status(200).json({ message: "Evaluation submitted successfully", status: "OK" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}

const fetchEvaluation = async (req, res) => {
    const { student_id } = req.body;
    if (!student_id) return res.status(400).json({ message: "Missing student_id" });
    try {
        const [rows] = await connection.execute("SELECT * FROM Student_Evaluation_Table WHERE student_id = ?", [student_id]);
        return res.status(200).json({ message: rows[0] || null, status: "OK" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
}

module.exports = { submitEvaluation, fetchEvaluation }
