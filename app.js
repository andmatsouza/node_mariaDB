//importamos o express p podermos criar as rotas
const express = require("express");
//importamos a model user, objeto que vamos usar p manipular o banco de dados 
const User = require("./model/User");


const app = express();
app.use(express.json());

//rotas que a nossa api vai disponibilizar para um cliente(browser, aplicativo, sistema, etc..)

//1ª rota - cadastrar um usúario na tabela users
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

//2ª rota - listar todos os usúarios na tabela users
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

//3ª rota - listar um usúario pelo seu id na tabela users
app.get("/user/:id", async (req, res) => {
  const { id } = req.params;

  //await User.findAll({ where: { id: id } })
  await User.findByPk(id)
  .then((user) => {
      return res.json({
          erro: false,
          user: user
      });
  }).catch(() => {
      return res.status(400).json({
          erro: true,
          mensagem: "Erro: Nenhum usuário encontrado!"
      });
  });
});

//4ª rota - atualizar um usúario pelo seu id na tabela users
app.put("/user", async (req, res) => {
  const { id } = req.body;  
  
  await User.update(req.body, {where: {id}})
  .then(() => {
      return res.json({
          erro: false,
          mensagem: "Usuário editado com sucesso!"
      });

  }).catch(() => {
      return res.status(400).json({
          erro: true,
          mensagem: "Erro: Usuário não editado com sucesso!"
      });
  });
});

//5ª rota - apagar um usúario pelo seu id na tabela users
app.delete("/user/:id", async (req, res) => {
  const { id } = req.params;    

  await User.destroy({ where: {id}})
  .then(() => {
      return res.json({
          erro: false,
          mensagem: "Usuário apgado com sucesso!"
      });
  }).catch(() => {
      return res.status(400).json({
          erro: true,
          mensagem: "Erro: Usuário não apgado com sucesso!"
      });
  });
});

//inicia um servidor web na porta 3000 p acessar digite essa url 
//http://localhost:3000 no navegador
app.listen(3000, () => {
  console.log("Servidor iniciado na porta 3000: http://localhost:3000");
});