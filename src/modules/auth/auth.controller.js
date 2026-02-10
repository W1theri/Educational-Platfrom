const jwt = require("jsonwebtoken");
const User = require("../../db/models/user");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../../config/env");

function signToken(user) {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }
    return jwt.sign(
        {
            sub: user._id.toString(),
            role: user.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

exports.register = async (req, res) => {
    try {
        const { username, fullName, email, password, role } = req.body;

        const nameSource = (fullName || username || "").trim();
        if (!nameSource || !email || !password) {
            return res.status(400).json({
                error: "fullName (or username), email, and password are required",
            });
        }

        if (role && !["student", "teacher"].includes(role)) {
            return res.status(400).json({
                error: 'role must be "student" or "teacher"',
            });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ error: "Email already in use" });
        }

        const user = await User.create({
            username: nameSource,
            email,
            password,
            role: role || "student",
        });

        const token = signToken(user);
        return res.status(201).json({
            token,
            user: user.toJSON(),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const ok = await user.comparePassword(password);
        if (!ok) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = signToken(user);
        return res.json({
            token,
            user: user.toJSON(),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    }
};
