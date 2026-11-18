const connection = require("../../sqlConnection");

const logbookCreate = async (req, res) => {
    console.log("logbookCreate", req.body);
    const student_id = req.body?.student_id
    const date = req.body?.date
    const week_number = req.body?.week_number
    const activity_description = req.body?.activity_description
    const image_attachment = req.body?.image_attachment
    if (!student_id || !date || !week_number || !activity_description) {
        return res.status(400).json({ message: "Please provide student_id, date, week_number and activity_description" })
    }
    try {
        // Query student's SIWES timeline and supervisor assignments
        const [studentQuery] = await connection.execute('SELECT Start_Date, End_Date, School_Supervisor_Id, Organization_Supervisor_Id, Organization_Id FROM Student_Table WHERE id=?', [student_id]);
        if (studentQuery.length === 0) {
            return res.status(404).json({ message: "Student record not found" });
        }
        
        const { Start_Date, End_Date, School_Supervisor_Id, Organization_Supervisor_Id, Organization_Id } = studentQuery[0];
        if (!School_Supervisor_Id || !Organization_Supervisor_Id || !Organization_Id) {
            return res.status(400).json({ message: "Logbook entry blocked: You must be accepted by a company and assigned both school and company supervisors before you can write logbook entries." });
        }
        if (!Start_Date || !End_Date) {
            return res.status(400).json({ message: "Your SIWES start and end dates are not configured yet. Please contact your coordinator." });
        }
        
        const dateStr = typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0];
        
        // Prevent submissions on weekends (Saturday = 6, Sunday = 0)
        const dayOfWeek = new Date(`${dateStr}T12:00:00`).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return res.status(400).json({ message: "Cannot submit logbook entries for weekends (Saturday or Sunday). SIWES logs are for official workdays only." });
        }

        const logTime = new Date(`${dateStr}T00:00:00`).getTime();
        const startTime = new Date(Start_Date).setHours(0, 0, 0, 0);
        const endTime = new Date(End_Date).setHours(0, 0, 0, 0);
        const todayTime = new Date().setHours(0, 0, 0, 0);
        
        if (logTime < startTime) {
            const formattedStart = new Date(Start_Date).toLocaleDateString();
            return res.status(400).json({ message: `Cannot submit logbook entry before your SIWES start date (${formattedStart}).` });
        }
        if (logTime > endTime) {
            const formattedEnd = new Date(End_Date).toLocaleDateString();
            return res.status(400).json({ message: `Cannot submit logbook entry after your SIWES end date (${formattedEnd}).` });
        }
        if (logTime > todayTime) {
            return res.status(400).json({ message: "Cannot submit a logbook entry for a future date." });
        }

        // Check if student is on approved leave on this date
        const [leaveCheck] = await connection.execute(
            "SELECT id FROM Leave_Requests_Table WHERE student_id = ? AND status = 'approved' AND ? BETWEEN DATE(start_date) AND DATE(end_date)",
            [student_id, dateStr]
        );
        if (leaveCheck.length > 0) {
            return res.status(400).json({ message: "You are on approved leave for this date. Logbook entries cannot be submitted on leave days." });
        }

        // Accurately compute calendar-aligned week number from Start_Date
        let calculatedWeek = week_number;
        if (Start_Date) {
            const target = new Date(`${dateStr}T12:00:00`);
            const startStr = typeof Start_Date === 'string' ? Start_Date.split('T')[0] : new Date(Start_Date).toISOString().split('T')[0];
            const start = new Date(`${startStr}T12:00:00`);
            
            const startDay = start.getDay();
            const startMondayDiff = startDay === 0 ? -6 : 1 - startDay;
            const startMonday = new Date(start);
            startMonday.setDate(start.getDate() + startMondayDiff);
            startMonday.setHours(0, 0, 0, 0);

            const targetDay = target.getDay();
            const targetMondayDiff = targetDay === 0 ? -6 : 1 - targetDay;
            const targetMonday = new Date(target);
            targetMonday.setDate(target.getDate() + targetMondayDiff);
            targetMonday.setHours(0, 0, 0, 0);

            const diffTime = targetMonday.getTime() - startMonday.getTime();
            const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
            calculatedWeek = Math.max(1, diffWeeks + 1);
        }

        // Prevent duplicate logs for the same date
        const [dupQuery] = await connection.execute('SELECT id FROM Logbook_Table WHERE student_id=? AND DATE(date)=DATE(?)', [student_id, dateStr]);
        if (dupQuery.length > 0) {
            return res.status(400).json({ message: "An entry has already been recorded for this date." });
        }

        const command = 'INSERT INTO Logbook_Table (student_id, date, week_number, activity_description, image_attachment) VALUES (?,?,?,?,?)'
        const values = [student_id, dateStr, calculatedWeek, activity_description, image_attachment || null]
        const [result] = await connection.execute(command, values)
        res.status(200).json({ message: "Logbook entry created successfully", id: result?.insertId, status: "OK" })
    } catch (error) {
        console.log(error);
        res.status(501).json({ message: "Error creating logbook entry" })
    }
}

module.exports = logbookCreate
