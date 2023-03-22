const express = require("express");
const db = require("./model/db");

const app = express();
app.use(express.json());

app.get("/usuarios", (req, res) => {
  return res.json({
    erro: false,
    name: "Anderson Mathias",
    email: "andmatsou@gmail.com"
  });
});

app.get("/usuario/:id", (req, res) => {
  const { id } = req.params;
  return res.json({
    erro: false,
    id,
    name: "Anderson",
    email: "andmatsou@gmail.com"
  });
});

app.post("/usuario", (req, res) => {
  const { nome, email} = req.body;
  return res.json({
    erro: false,    
    nome,
    email
  });
});

app.put("/usuario", (req, res) => {
  const { id, nome, email} = req.body;
  return res.json({
    erro: false,
    id,    
    nome,
    email
  });
});

app.delete("/usuario/:id", (req, res) => {
  const { id } = req.params;
  return res.json({
    erro: false,
    id,    
  });
});

app.listen(3000, () => {
  console.log("Servidor iniciado na porta 3000: http://localhost:3000");
});