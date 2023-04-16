import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Criação do servidor
const app = express();

// Configurações
app.use(express.json());
app.use(cors());
dotenv.config();

// Setup do Banco de Dados
let db;
const mongoClient = new MongoClient(process.env.DATABASE_URL);
mongoClient
  .connect()
  .then(() => (db = mongoClient.db()))
  .catch((err) => console.log(err.message));

const PARTICIPANTE_TEMPLATE = {name: 'João', lastStatus: 12313123};
const MESSAGE_TEMPLATE = {from: 'João', to: 'Todos', text: 'oi galera', type: 'message', time: '20:04:37'};

app.post("/participants", async (req, res) => {})

app.get("/participants", async (req, res) => {})

app.post("/messages", async (req, res) => {})

app.get("/messages", async (req, res) => {})

app.post("/status", async (req, res) => {})

  // Deixa o app escutando, à espera de requisições
const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
