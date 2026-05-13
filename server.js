const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());


// Create uploads folder automatically
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}


// Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + "-" + file.originalname
    );
  },
});

const upload = multer({ storage });


// Nodemailer Transport
const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// Contact API
app.post(
  "/api/contact",
  upload.single("file"),
  async (req, res) => {

    try {

      const { name, email, message } = req.body;

      // Mail options
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

      // Send mail
      await transporter.sendMail(mailOptions);

      res.status(200).json({
        success: true,
        message: "Mail sent successfully",
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        success: false,
        message: "Error sending mail",
      });
    }
  }
);


// Start Server
app.listen(process.env.PORT, () => {
  console.log(
    `Server running on port ${process.env.PORT}`
  );
});