const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
require("dotenv").config();

const sgMail = require("@sendgrid/mail");

const app = express();

// ✅ SendGrid setup
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ✅ Middleware
app.use(cors({
  origin: ["https://morjobs.sg", "http://localhost:3000"],
  methods: ["GET", "POST"],
}));
app.use(express.json());

// ✅ Ensure uploads folder exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// ✅ Multer config
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
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ✅ Contact API
app.post("/api/contact", upload.single("file"), async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const msg = {
      to: "queryadon@gmail.com",        // your email
      from: "queryadon@gmail.com",      // MUST be verified in SendGrid
      replyTo: email,
      subject: "New Contact Form Submission",
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p>${message}</p>
      `,
      attachments: req.file
        ? [
            {
              content: fs.readFileSync(req.file.path).toString("base64"),
              filename: req.file.originalname,
              type: req.file.mimetype,
              disposition: "attachment",
            },
          ]
        : [],
    };

    await sgMail.send(msg);

    res.status(200).json({
      success: true,
      message: "Mail sent successfully",
    });

  } catch (err) {
    console.error("SENDGRID ERROR:", err);

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

// ✅ Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
