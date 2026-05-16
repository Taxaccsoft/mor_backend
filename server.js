const express = require("express");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

// ✅ Middleware
app.use(cors({
  origin: ["https://morjobs.sg", "http://localhost:3000"],
  methods: ["GET", "POST"],
}));
app.use(express.json());

// ✅ Multer - memory storage (no disk, works on Render)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
    }
  },
});

// ✅ Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use TLS, not SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Verify transporter on startup
transporter.verify((error) => {
  if (error) {
    console.error("Mail transporter error:", error.message);
    console.error("Full error:", JSON.stringify(error));
  } else {
    console.log("Mail transporter ready ✅");
  }
});

// ✅ Contact API
app.post("/api/contact", upload.single("file"), async (req, res) => {
  const { name, email, message } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "Name, email, and message are required.",
    });
  }

  const mailOptions = {
    from: `"${name}" <${process.env.EMAIL_USER}>`,
    to: process.env.RECEIVER_EMAIL,
    replyTo: email,
    subject: `New Contact Form Submission from ${name}`,
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
            content: req.file.buffer,
            contentType: req.file.mimetype,
          },
        ]
      : [],
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({
      success: true,
      message: "Mail sent successfully",
    });
  } catch (err) {
    console.error("MAIL ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ✅ Root route
app.get("/", (req, res) => {
  res.send("Backend is running...");
});

// ✅ Global error handler for multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: "File too large. Max 5MB allowed." });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
console.log("ENV CHECK:", {
  user: process.env.EMAIL_USER,
  pass: !!process.env.EMAIL_PASS,
  receiver: process.env.RECEIVER_EMAIL,
});
