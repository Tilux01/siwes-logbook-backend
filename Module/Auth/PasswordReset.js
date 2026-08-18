const connection = require("../../sqlConnection");
const mailUser = require("../../Mailer.js");

const getTableAndColumnByRole = (role) => {
    switch (role) {
        case 'student':
            return { table: 'Student_Table', column: 'email_address' };
        case 'school':
            return { table: 'Instituition_Table', column: 'Mail' };
        case 'organization':
            return { table: 'Organization_Table', column: 'Email_Address' };
        case 'org_supervisor':
            return { table: 'Organization_Supervisor', column: 'Email_Address' };
        case 'school_supervisor':
            return { table: 'School_Supervisor', column: 'Email_Address' };
        default:
            return null;
    }
};

const sendResetOTP = async (req, res) => {
    console.log("sendResetOTP", req.body);
    const { email, role } = req.body;
    
    if (!email || !role) {
        return res.status(400).json({ message: "Please provide email and role" });
    }

    const mapping = getTableAndColumnByRole(role);
    if (!mapping) {
        return res.status(400).json({ message: "Invalid role specified" });
    }

    try {
        // Check if user exists
        const checkCommand = `SELECT * FROM \`${mapping.table}\` WHERE \`${mapping.column}\` = ?`;
        const [users] = await connection.execute(checkCommand, [email]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: "No account found with that email address" });
        }

        // Delete any existing OTP for this email
        const deleteCommand = 'DELETE FROM `OTP_Verification_Table` WHERE email_address=?';
        await connection.execute(deleteCommand, [email]);
        
        // Generate and send OTP via email
        const otpCode = await mailUser(email);
        
        // Save new OTP
        const saveCommand = 'INSERT INTO OTP_Verification_Table (email_address, otp_code) VALUES (?,?)';
        await connection.execute(saveCommand, [email, otpCode]);
        
        res.status(200).json({ message: "Password reset OTP sent to your email" });
    } catch (error) {
        console.error("Password Reset OTP Error:", error);
        res.status(500).json({ message: "Failed to send reset OTP" });
    }
};

const updatePassword = async (req, res) => {
    console.log("updatePassword", req.body);
    const { email, role, newPassword, otpCode } = req.body;

    if (!email || !role || !newPassword || !otpCode) {
        return res.status(400).json({ message: "Please provide all required fields" });
    }

    const mapping = getTableAndColumnByRole(role);
    if (!mapping) {
        return res.status(400).json({ message: "Invalid role specified" });
    }

    try {
        // Verify OTP (same logic as OTPVerify.js, but combined here)
        const [otpQuery] = await connection.execute('SELECT * FROM `OTP_Verification_Table` WHERE email_address=? AND otp_code=?', [email, otpCode]);
        
        if (otpQuery.length === 0) {
            return res.status(400).json({ message: "Invalid or incorrect OTP code" });
        }

        // Check expiry using database's NOW() to prevent timezone mismatches between Node and MySQL
        const [validOtp] = await connection.execute(
            'SELECT * FROM `OTP_Verification_Table` WHERE email_address=? AND otp_code=? AND expires_at > NOW()', 
            [email, otpCode]
        );
        
        if (validOtp.length === 0) {
            return res.status(400).json({ message: "OTP code has expired" });
        }

        // Update Password
        const updateCommand = `UPDATE \`${mapping.table}\` SET password = ? WHERE \`${mapping.column}\` = ?`;
        await connection.execute(updateCommand, [newPassword, email]);

        // Clean up OTP
        await connection.execute('DELETE FROM `OTP_Verification_Table` WHERE email_address=?', [email]);

        res.status(200).json({ message: "Password successfully updated!" });
    } catch (error) {
        console.error("Password Update Error:", error);
        res.status(500).json({ message: "Failed to update password" });
    }
};

module.exports = { sendResetOTP, updatePassword };
