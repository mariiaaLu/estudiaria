console.log("SERVER INICIADO");

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import fs from "fs";
import OpenAI from "openai";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(".")); // 👈 IMPORTANTE

const upload = multer({ dest: "uploads/" });

// IA
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

// HOME (sirve tu HTML)
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

// PDF
app.post("/upload", upload.single("file"), async (req, res) => {
  try {

    if (!req.file) return res.json({ texto: "" });

    const buffer = fs.readFileSync(req.file.path);

    const data = await pdfParse(buffer);

    res.json({ texto: data.text });

  } catch (err) {
    console.error(err);
    res.json({ texto: "Error PDF" });
  }
});

// IA
app.post("/resumir", async (req, res) => {
  try {

    const { texto, categoria, modo } = req.body;

    if (!texto) return res.json({ resultado: "Sin texto" });

    const response = await client.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `Eres profesor. Nivel: ${categoria}. Modo: ${modo}`
        },
        {
          role: "user",
          content: texto
        }
      ]
    });

    res.json({
      resultado: response.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.json({ resultado: "Error IA" });
  }
});

app.listen(PORT, () => {
  console.log("Servidor en puerto " + PORT);
});