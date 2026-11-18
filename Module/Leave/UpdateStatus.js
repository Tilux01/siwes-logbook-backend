const connection = require("../../sqlConnection");

const updateLeaveStatus = async (req, res) => {
    const { leave_id, status, org_supervisor_id } = req.body;
    
    if (!leave_id || !status || !org_supervisor_id) {
        return res.status(400).json({ message: "Please provide leave_id, status, and org_supervisor_id" });
    }

    try {
        // Fetch the leave request
        const [leaveRes] = await connection.execute("SELECT * FROM Leave_Requests_Table WHERE id = ?", [leave_id]);
        if (leaveRes.length === 0) {
            return res.status(404).json({ message: "Leave request not found" });
        }
        
        const leaveReq = leaveRes[0];
        
        // Ensure the supervisor is assigned to this student (or owns this request)
        if (leaveReq.org_supervisor_id !== org_supervisor_id) {
            return res.status(403).json({ message: "Unauthorized to manage this leave request" });
        }

        // Update the leave status
        await connection.execute("UPDATE Leave_Requests_Table SET status = ? WHERE id = ?", [status, leave_id]);

        // Clean up any legacy fake daily log entries created from leaves
        try {
            await connection.execute("DELETE FROM Logbook_Table WHERE activity_description LIKE 'LEAVE:%'");
        } catch (cleanupErr) {
            console.error("Error cleaning up legacy leave logbook entries:", cleanupErr);
        }

        res.status(200).json({ message: "Leave status updated successfully", status: "OK" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error updating leave status" });
    }
}

module.exports = updateLeaveStatus;
