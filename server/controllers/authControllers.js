const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");


// ==========================================
// Email Transporter
// ==========================================
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

transporter.verify((error, success) => {
  if (error) {
    console.log("❌ Gmail SMTP Error:", error);
  } else {
    console.log("✅ Gmail SMTP Ready");
  }
});
// ==========================================
// Register User
// ==========================================

const register = async (req, res) => {
  try {

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Signup Successful",

      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
};


// ==========================================
// Login User
// ==========================================

const login = async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d"
      }
    );

    res.status(200).json({

      message: "Login Successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }

    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};


// ==========================================
// Forgot Password
// ==========================================

const forgotPassword = async (req, res) => {

  try {

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }


    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });


    // Same response even if user doesn't exist

    if (!user) {

      return res.status(200).json({
        message:
          "If an account exists with this email, a reset link has been sent.",
      });

    }


    // Generate random token

    const resetToken = crypto.randomBytes(32).toString("hex");


    // Store HASH of token in database

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");


    user.resetPasswordToken = hashedToken;

    user.resetPasswordExpires =
      Date.now() + 15 * 60 * 1000;

    await user.save();


    // ==========================================
    // Reset URL
    // ==========================================

    console.log(
      "🌐 FRONTEND_URL:",
      process.env.FRONTEND_URL
    );
const resetURL =
  `${process.env.FRONTEND_URL}/reset-password.html?token=${encodeURIComponent(resetToken)}`;

console.log("🌐 FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("🔗 RESET URL:", resetURL);


    // ==========================================
    // Send Email
    // ==========================================

    await transporter.sendMail({

      from: `"Padhaai Saathi" <${process.env.EMAIL_USER}>`,

      to: user.email,

      subject: "Reset your Padhaai Saathi password",

      html: `

        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 30px;
        ">

          <h2>🔐 Padhaai Saathi Password Reset</h2>

          <p>
            We received a request to reset your Padhaai Saathi password.
          </p>

          <p>
            Click the button below to create a new password.
          </p>

          <a
            href="${resetURL}"
            style="
              display: inline-block;
              padding: 12px 22px;
              background: #6c5ce7;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              margin: 15px 0;
            "
          >
            Reset Password
          </a>

          <p>
            This link will expire in <strong>15 minutes</strong>.
          </p>

          <p>
            If you did not request a password reset,
            you can safely ignore this email.
          </p>

          <hr>

          <p style="color: #777;">
            Padhaai Saathi
          </p>

        </div>

      `,

    });


    res.status(200).json({

      message:
        "If an account exists with this email, a reset link has been sent.",

    });


  } catch (error) {

    console.error(
      "❌ Forgot Password Error:",
      error
    );

    res.status(500).json({

      message:
        "Unable to process password reset request",

    });

  }

};


// ==========================================
// Reset Password
// ==========================================

const resetPassword = async (req, res) => {

  try {

    const { token, password } = req.body;


    if (!token || !password) {

      return res.status(400).json({

        message:
          "Token and new password are required",

      });

    }


    // Minimum password length

    if (password.length < 6) {

      return res.status(400).json({

        message:
          "Password must be at least 6 characters",

      });

    }


    // Hash token received from URL

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");


    // Find user with valid token

    const user = await User.findOne({

      resetPasswordToken: hashedToken,

      resetPasswordExpires: {
        $gt: Date.now(),
      },

    });


    if (!user) {

      return res.status(400).json({

        message:
          "Reset link is invalid or expired",

      });

    }


    // Hash new password

    const hashedPassword =
      await bcrypt.hash(password, 10);


    user.password = hashedPassword;


    // Invalidate reset token

    user.resetPasswordToken = null;

    user.resetPasswordExpires = null;


    await user.save();


    res.status(200).json({

      message:
        "Password reset successful",

    });


  } catch (error) {

    console.error(
      "❌ Reset Password Error:",
      error
    );

    res.status(500).json({

      message:
        "Unable to reset password",

    });

  }

};


// ==========================================
// Export
// ==========================================

module.exports = {

  register,

  login,

  forgotPassword,

  resetPassword,

};