import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

// Criação do servidor
const app = express();

// Configurações
app.use(express.json());
app.use(cors());

// Setup do Banco de Dados
let db;
const mongoClient = new MongoClient("mongodb://localhost:27017/nomeDoBanco");
mongoClient
  .connect()
  .then(() => (db = mongoClient.db()))
  .catch((err) => console.log(err.message));

// Deixa o app escutando, à espera de requisições
const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
