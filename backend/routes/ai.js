const router = require("express").Router();
const Groq = require("groq-sdk");
const multer = require("multer");
const Tesseract = require("tesseract.js");

const upload = multer({
  storage: multer.memoryStorage(),
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.post(
  "/solve",
  upload.single("image"),
  async (req, res) => {
    try {

      let extractedText = "";

      // OCR IMAGE
      if (req.file) {

        const result = await Tesseract.recognize(
          req.file.buffer,
          "eng",
          {
            logger: (m) => console.log(m),
          }
        );

        extractedText = result.data.text;
      }

      const {
        question,
        tutorStyle,
      } = req.body;

      const finalPrompt = `
You are an AI homework tutor.

Tutor Style:
${tutorStyle || "friendly"}

If OCR text looks messy,
try to intelligently understand it.

Use:
- markdown
- headings
- bullet points
- step-by-step teaching

Question:
${question}

OCR Text:
${extractedText}
`;

      const completion =
        await groq.chat.completions.create({
          model:
            "llama-3.3-70b-versatile",

          messages: [
            {
              role: "user",
              content: finalPrompt,
            },
          ],
        });

      res.json({
        answer:
          completion.choices[0]?.message
            ?.content || "No response",
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        error: "Something went wrong",
      });

    }
  }
);

module.exports = router;