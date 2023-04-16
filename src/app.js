import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";

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
const MINIMUM = 1;
const participantSchema = joi.object({
  name: joi.string().min(MINIMUM).required(),
});
const messageSchema = joi.object({
  to: joi.string().min(MINIMUM).required(),
  text: joi.string().min(MINIMUM).required(),
  type: joi.string().valid("message", "private_message").required(),
});
const limitSchema = joi.object({
  limit: joi.number().integer().min(MINIMUM),
});

// Route: POST "/participants" ===============================================================================
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
      .findOne({ name: name });

    if (name_uniqueness) {
      res.sendStatus(409);
      return;
    }

    const participant = {
      name,
      lastStatus: Date.now(),
    };

    await db.collection("participants").insertOne(participant);

    await db.collection("messages").insertOne({
      from: name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: dayjs().format("HH:mm:ss"),
    });

    res.sendStatus(201);
    return;
  } catch (error) {
    res.status(500).send(error.message);
    return;
  }
});

// Route: GET "/participants" ===============================================================================
app.get("/participants", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray();
    res.status(200).send(participants);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route: POST "/messages" ===============================================================================
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

// Route: GET "/messages" ===============================================================================
app.get("/messages", async (req, res) => {
  const { limit } = req.query;
  const { user } = req.headers;

  try {
    const messages = await db
      .collection("messages")
      .find({
        $or: [{ to: "Todos" }, { to: user }, { from: user }],
      })
      .toArray();

    if (limit) {
      const validation = limitSchema.validate(
        { limit },
        {
          abortEarly: false,
        }
      );

      if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message);
        res.status(422).send(errors);
        return;
      }
    }
    res.status(200).send(messages.slice(-limit));
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route: POST "/status" ===============================================================================
app.post("/status", async (req, res) => {
  const { user } = req.headers;

  if (!user) {
    res.sendStatus(404);
  }

  try {
    const existence = await db
      .collection("participants")
      .findOne({ name: user });

    if (!existence) {
      res.sendStatus(404);
      return;
    }

    db.collection("participants").updateOne(existence, {
      $set: { lastStatus: Date.now() },
    });

    res.sendStatus(200);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Remoção automática de usuários inativos

//A cada 15 segundos, remova da lista de participantes os participantes que possuam um lastStatus de mais de 10 segundos atrás.
const INTERVAL_TIMER = 15000;
const IMPERMANENCE_POINT = 10000;
setInterval(purgeParticipants, INTERVAL_TIMER)
async function purgeParticipants(){
  return
} 
//Dica: você pode usar setInterval no arquivo do seu servidor. Procure por Query Selectors do MongoDB que te ajudem na filtragem.

//Para cada participante removido, salve uma nova mensagem no banco, no formato:
/*{ 
	from: 'xxx',
	to: 'Todos',
	text: 'sai da sala...',
	type: 'status',
	time: 'HH:mm:ss'
}*/

// Deixa o app escutando, à espera de requisições
const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
