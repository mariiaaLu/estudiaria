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
app.use(express.static(".")); // sirve el frontend

const upload = multer({ dest: "uploads/" });

// 🔑 IA
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

// 🏠 FRONTEND
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

// 📄 PDF
app.post("/upload", upload.single("file"), async (req, res) => {
  try {

    if (!req.file) {
      return res.json({ texto: "" });
    }

    const buffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(buffer);

    res.json({ texto: data.text });

  } catch (err) {
    console.error(err);
    res.json({ texto: "Error leyendo PDF" });
  }
});

// 🧠 IA
app.post("/resumir", async (req, res) => {
  try {

    const { texto, categoria, modo } = req.body;

    if (!texto) {
      return res.json({ resultado: "No hay texto" });
    }

    let instruccion = "";

    if (modo === "facil") {
      instruccion = "Explícalo muy fácil para estudiantes.";
    } else if (modo === "test") {
      instruccion = "Crea un test de 5 preguntas con respuestas.";
    } else if (modo === "ultra") {
      instruccion = "Haz un resumen muy corto.";
    } else {
      instruccion = "Haz un resumen claro y estructurado.";
    }

    const response = await client.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
Eres un profesor profesional.

REGLAS ESTRICTAS:
- NO inventes el nivel educativo
- Usa SOLO el nivel indicado: ${categoria}
- Si es "Primaria", no puedes usar ESO, Bachillerato ni Universidad
- No menciones el nivel en la respuesta
- No hagas introducciones

Nivel obligatorio: ${categoria}
Modo: ${modo}

Instrucción:
${instruccion}
          `
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