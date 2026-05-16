const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");
const fs = require("fs");
require("dotenv").config();

const app = express();

// ✅ Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());

// ✅ Ensure uploads folder exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// ✅ Multer config (with file size limit)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ✅ Nodemailer transporter (Gmail App Password REQUIRED)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Verify transporter (helps debugging)
transporter.verify((error, success) => {
  if (error) {
    console.error("Transporter Error:", error);
  } else {
    console.log("Server is ready to send emails");
  }
});

// ✅ Contact API
app.post("/api/contact", upload.single("file"), async (req, res) => {
  try {
    console.log("Incoming request:", req.body);
    console.log("File:", req.file);

    const { name, email, message } = req.body;

    // ❌ Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ✅ Mail options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECEIVER_EMAIL,
      subject: "New Contact Form Submission",
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
      attachments: req.file
        ? [
            {
              filename: req.file.originalname,
              path: req.file.path,
            },
          ]
        : [],
    };

    // ✅ Send mail
    await transporter.sendMail(mailOptions);

    console.log("Mail sent successfully");

    res.status(200).json({
      success: true,
      message: "Mail sent successfully",
    });
  } catch (err) {
    console.error("MAIL ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message || "Error sending mail",
    });
  }
});

// ✅ Root route (to check server is alive)
app.get("/", (req, res) => {
  res.send("Backend is running...");
});

// ✅ Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
