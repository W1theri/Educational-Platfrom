const User = require("../../db/models/user");

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.json(user.toJSON());
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { username, dateOfBirth, phoneNumber } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (username) user.username = username;
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
        if (dateOfBirth) {
            const dob = new Date(dateOfBirth);
            if (isNaN(dob)) {
                return res.status(400).json({ error: "Invalid dateOfBirth format" });
            }
            user.dateOfBirth = dob;
        }

        await user.save();
        return res.json(user.toJSON());
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: "currentPassword and newPassword are required",
            });
        }

        const user = await User.findById(req.user.id).select("+password");
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const ok = await user.comparePassword(currentPassword);
        if (!ok) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        user.password = newPassword;
        await user.save();
        return res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.json(user.toJSON());
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
};
