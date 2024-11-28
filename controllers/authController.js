const crypto = require('crypto');
const { Op } = require('sequelize');
const { User } = require('../models/User');
const bcrypt = require('bcryptjs'); // For password hashing
const nodemailer = require('nodemailer');
const sequelize = require('../config/db'); // Import your database connection
// Forgot Password Controller
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // Check if the email exists in the database
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'No user found with this email.' });
        }

        // Generate a unique reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Set token and expiry on the user
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
        await user.save();

        // Send reset link via email
        const resetUrl =
            process.env.NODE_ENV === 'production'
                ? `https://global-bazaar-frontend.vercel.app/reset-password/${resetToken}`
                : `http://localhost:3000/reset-password/${resetToken}`;

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            to: email,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Click the link to reset your password: ${resetUrl}`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Reset password email sent successfully.' });
    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// Reset Password Controller
exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        // Hash the received token to match the one in the database
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find the user with the token and ensure it hasn't expired
        const user = await User.findOne({
            where: {
                resetPasswordToken: hashedToken,
                resetPasswordExpires: { [Op.gt]: Date.now() }, // Expiry must be in the future
            },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }

        // Update the user's password and clear the token
        user.password = newPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.status(200).json({ message: 'Password reset successful.' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};
exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if the user already exists in the PendingUsers table or Users table
        const [pendingUser] = await sequelize.query(
            `SELECT * FROM PendingUsers WHERE email = :email`,
            { replacements: { email } }
        );
        const [existingUser] = await sequelize.query(
            `SELECT * FROM Users WHERE email = :email`,
            { replacements: { email } }
        );

        if (pendingUser.length > 0 || existingUser.length > 0) {
            return res.status(400).json({ message: 'A user with this email already exists or is under verification.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user details into the PendingUsers table
        console.log('Inserting user into PendingUsers table:', username, email);

// Insert user into PendingUsers table
await sequelize.query(`
    INSERT INTO PendingUsers (username, email, password)
    VALUES (:username, :email, :password)
`, {
    replacements: { username, email, password: hashedPassword },
});

console.log('User successfully inserted into PendingUsers table.');


        // Send email to admin for verification
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const adminVerificationUrl = process.env.NODE_ENV === 'production'
            ? `https://global-bazaar-backend.vercel.app/auth/verify-account`
            : `http://localhost:5000/auth/verify-account`;

        await transporter.sendMail({
            from: process.env.EMAIL,
            to: 'salmanahmad356240@gmail.com', // Admin email
            subject: 'New Account Verification Request',
            html: `
                <h3>New Account Verification</h3>
                <p><strong>Username:</strong> ${username}</p>
                <p><strong>Email:</strong> ${email}</p>
                <button><a href="${adminVerificationUrl}?username=${username}&email=${email}&password=${hashedPassword}&action=accept">Accept</a></button>
                <button><a href="${adminVerificationUrl}?username=${username}&email=${email}&password=${hashedPassword}&action=reject">Reject</a></button>
            `,
        });

        // Notify user about verification process
        await transporter.sendMail({
            from: process.env.EMAIL,
            to: email,
            subject: 'Account Under Verification',
            text: `Hello ${username}, your account is under verification. You will be notified once it is approved or rejected.`,
        });

        res.status(200).json({ message: 'Your account is under verification. Admin approval is required.' });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

exports.verifyAccount = async (req, res) => {
    const { username, email, password, action } = req.query;

    try {
        if (action === 'accept') {
            // Move the user from PendingUsers to the Users table
            await sequelize.query(`
                INSERT INTO Users (username, email, password, verified, role, createdAt)
                VALUES (:username, :email, :password, true, 'user', CURRENT_TIMESTAMP)
            `, {
                replacements: { username, email, password },
            });

            // Notify the user about account approval
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
            });

            await transporter.sendMail({
                from: process.env.EMAIL,
                to: email,
                subject: 'Account Approved',
                text: `Hello ${username}, your account has been approved. You can now log in.`,
            });

            // Remove user from PendingUsers table
            await sequelize.query(`
                DELETE FROM PendingUsers WHERE email = :email
            `, { replacements: { email } });

            res.send('Account approved successfully.');
        } else if (action === 'reject') {
            // Notify the user about account rejection
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
            });

            await transporter.sendMail({
                from: process.env.EMAIL,
                to: email,
                subject: 'Account Rejected',
                text: `Hello ${username}, your account creation request has been rejected.`,
            });

            // Remove user from PendingUsers table
            await sequelize.query(`
                DELETE FROM PendingUsers WHERE email = :email
            `, { replacements: { email } });

            res.send('Account rejected successfully.');
        } else {
            res.status(400).send('Invalid action.');
        }
    } catch (error) {
        console.error('Verify Account Error:', error);
        res.status(500).send('Internal server error.');
    }
};
exports.editAccount = async (req, res) => {
    const { userId } = req.user; // Get logged-in user's ID from the token
    const { username, email, password } = req.body;

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Update username if provided
        if (username) {
            user.username = username;
        }

        // Update password if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        // Handle email change
        if (email && email !== user.email) {
            // Generate a verification token
            const emailVerificationToken = crypto.randomBytes(32).toString('hex');

            // Temporarily store the new email and token in the user's record
            user.pendingEmail = email;
            user.emailVerificationToken = emailVerificationToken;

            // Send verification email to the new email address
            const verificationUrl =
                process.env.NODE_ENV === 'production'
                    ? `https://global-bazaar-frontend.vercel.app/verify-email/${emailVerificationToken}`
                    : `http://localhost:3000/verify-email/${emailVerificationToken}`;

            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });

            await transporter.sendMail({
                from: process.env.EMAIL,
                to: email,
                subject: 'Email Change Verification',
                text: `Click the link to verify your new email: ${verificationUrl}`,
            });

            return res.status(200).json({ message: 'Verification email sent to the new email address.' });
        }

        // Save changes (username or password)
        await user.save();

        res.status(200).json({ message: 'Account updated successfully.' });
    } catch (error) {
        console.error('Edit Account Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

exports.verifyEmailChange = async (req, res) => {
    const { token } = req.params;

    try {
        // Find the user with the matching verification token
        const user = await User.findOne({ where: { emailVerificationToken: token } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }

        // Update the user's email and clear the temporary fields
        user.email = user.pendingEmail;
        user.pendingEmail = null;
        user.emailVerificationToken = null;
        await user.save();

        res.status(200).json({ message: 'Email updated successfully.' });
    } catch (error) {
        console.error('Email Verification Error:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};
