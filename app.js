//importamos o express p podermos criar as rotas
const express = require("express");
//importamos a model user, objeto que vamos usar p manipular o banco de dados 
const User = require("./model/User");


const app = express();
app.use(express.json());

//rotas que a nossa api vai disponibilizar para um cliente(browser, aplicativo, sistema, etc..)

//1ª rota - listar todos os usúarios da tabela users
app.get("/users", async (req, res) => {

  await User.findAll({
      attributes: ['id', 'name', 'email'], 
      order: [['id', 'DESC']]})
  .then((users) => {
      return res.json({
          erro: false,
          users
      });
  }).catch(() => {
      return res.status(400).json({
          erro: true,
          mensagem: "Erro: Nenhum usuário encontrado!"
      });
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