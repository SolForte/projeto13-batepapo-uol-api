import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";

// Criação do servidor
const app = express();

// Configurações
app.use(express.json());
app.use(cors());
dotenv.config();

// Setup do Banco de Dados
const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;
mongoClient
  .connect()
  .then(() => (db = mongoClient.db()))
  .catch((erro) => console.log(erro.message));

// Padrões para validação
const MINIMUM_LENGTH = 1;

const participantSchema = joi.object({
  name: joi.string().min(MINIMUM_LENGTH).required(),
});
const messageSchema = joi.object({
  to: joi.string().min(MINIMUM_LENGTH).required(),
  text: joi.string().min(MINIMUM_LENGTH).required(),
  type: joi.string().valid("message", "private_message").required(),
});

// Route: POST "/participants"
app.post("/participants", async (req, res) => {
  const { name } = req.body;

  const validation = participantSchema.validate(req.body, {
    abortEarly: false,
  });

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    return res.status(422).send(errors);
  }

  try {
    const name_uniqueness = await db
      .collection("participants")
      .findOne({ name });

    if (name_uniqueness) {
      res.sendStatus(409);
      return;
    }

    await db.collection("participants").insertOne({
      name,
      lastStatus: Date.now(),
    });

    await db.collection("messages").insertOne({
      from: name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: dayjs().format("HH:mm:ss"),
    });

    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(500).send(error.message);
  }
});

// Route: GET "/participants"
app.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray();
    res.status(200).send(participants);
  } catch (error) {
    res.sendStatus(500).send(error.message);
  }
});

// Route: POST "/messages"
app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const { user } = req.headers;

  const validation = messageSchema.validate(req.body, {
    abortEarly: false,
  });

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    return res.status(422).send(errors);
  }

  try {
    const name_existance = await db
      .collection("participants")
      .findOne({ name: user });

    if (!name_existance) {
      res.sendStatus(422);
      return;
    }

    await db.collection("messages").insertOne({
      to,
      from: user,
      text,
      type,
      time: dayjs().format("HH:mm:ss"),
    });

    res.sendStatus(201);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route: GET "/messages"
app.get("/messages", async (req, res) => {});

// Route: POST "/messages"
app.post("/status", async (req, res) => {});

// Deixa o app escutando, à espera de requisições
const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
