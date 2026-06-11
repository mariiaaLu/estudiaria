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
app.use(express.static("."));

const upload = multer({ dest: "uploads/" });

// 🔑 IA
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

// 🧪 test
app.get("/", (req, res) => {
  res.send("EstudiaIA OK 🚀");
});


// 📄 SUBIR ARCHIVO
app.post("/upload", upload.single("file"), async (req, res) => {
  try {

    if (!req.file) {
      return res.json({ texto: "" });
    }

    const buffer = fs.readFileSync(req.file.path);

    let texto = "";

    if (req.file.mimetype === "application/pdf") {
      const data = await pdfParse(buffer);
      texto = data.text;
    } else {
      texto = buffer.toString("utf8");
    }

    res.json({ texto });

  } catch (err) {
    console.error(err);
    res.json({ texto: "Error leyendo archivo" });
  }
});


// 🧠 IA RESUMEN / TEST
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
      instruccion = "Crea 5 preguntas tipo test con respuestas.";
    } else if (modo === "ultra") {
      instruccion = "Haz resumen muy corto.";
    } else {
      instruccion = "Haz resumen claro y estructurado.";
    }

    const response = await client.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `
Eres un profesor.

- No introducciones
- No frases tipo "el texto dice"
- Usa **negrita** en conceptos importantes
- Claro y educativo

Nivel: ${categoria}
Modo: ${modo}

Tarea:
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
  console.log("Servidor en http://localhost:" + PORT);
});