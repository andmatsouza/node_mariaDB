const express = require("express");
const User = require("./model/User");

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

app.post("/user", async (req, res) => {
  const { name, email} = req.body;

await User.create(req.body).
then(() => {
  return res.json({
    erro: false,
    mensagem: "Usuário cadastrado com sucesso!"   
  });

}).catch(() => {
  return res.status(400).json({
    erro: true,
    mensagem: "Erro: Usuário não cadastrado com sucesso!"   
  });
})

  
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