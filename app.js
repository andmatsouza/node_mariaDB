//importamos o express p podermos criar as rotas
const express = require("express");
//importamos o bcrypt p criptografar a senha
const bcrypt = require('bcryptjs'); 
//importamos o jonwebtoken usado p gerar o token de autenticação
const jwt = require("jsonwebtoken");
//importamos o módulo para validar o token
const { eAdmin } = require("./middlewares/auth");
//importamos o lib que gerencia as variaveis de ambiente
require('dotenv').config();
//importamos o cors serve para permitir acesso externo a API
const cors = require('cors');


//importamos a model user, objeto que vamos usar p manipular o banco de dados 
const User = require("./model/User");

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
  res.header("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type, Authorization")
  app.use(cors());
  next();
})


app.use(express.json());

//rotas que a nossa api vai disponibilizar para um cliente(browser, aplicativo, sistema, etc..)

//1ª rota - cadastrar um usúario na tabela users
app.post("/user", eAdmin, async (req, res) => {
  var dados = req.body;  
  dados.password = await bcrypt.hash(dados.password, 8);

await User.create(dados).
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
app.get("/users", eAdmin, async (req, res) => {

  await User.findAll({
      attributes: ['id', 'name', 'email', 'password'], 
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
app.get("/user/:id", eAdmin, async (req, res) => {
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
app.put("/user", eAdmin, async (req, res) => {
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
app.delete("/user/:id", eAdmin, async (req, res) => {
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

//6ª rota - atualizar a senha do usúario na tabela users
app.put("/user-senha", eAdmin, async (req, res) => {
  const { id, password } = req.body;  

  var senhaCrypt= await bcrypt.hash(password, 8);
  
  await User.update({password: senhaCrypt}, {where: {id}})
  .then(() => {
      return res.json({
          erro: false,
          mensagem: "Senha editada com sucesso!"
      });

  }).catch(() => {
      return res.status(400).json({
          erro: true,
          mensagem: "Erro: Senha não editada com sucesso!"
      });
  });
});

//7ª rota - login de um usuário
app.post('/login', async (req, res) => {

    await sleep(3000);

    function sleep(ms) {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    };

  const user = await User.findOne({
    attributes:['id', 'password', 'email', 'name'], 
    where: {email: req.body.email}
  });
  if(user === null){
    return res.status(400).json({
      erro: true,
      mensagem: "Erro: Usuário ou senha incorreta!"
  });
  }

  if(!(await bcrypt.compare(req.body.password, user.password))){
    return res.status(400).json({
      erro: true,
      mensagem: "Erro: Usuário ou senha incorreta!"
  });
  }

 const token = jwt.sign({id: user.id, /*levelAccess: 1*/}, process.env.SECRET, {
   // expiresIn: 600 //10 min
    expiresIn: '7d'
  })

  return res.json({
    erro: false,
    mensagem: "Login realizado com sucesso!",
    token
});
});

//8ª rota - validar o token
app.get("/val-token", eAdmin, async (req,res) => {
    await User.findByPk(req.userId, {attributes: ['id', 'name', 'email']})
    .then((user) => {
      return res.json({
        erro: false,
        user
       // mensagem: "Token válido! Id do usuário: " + req.userId + ". Nível de acesso: " + req.levelAccess
      })
    }).catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Erro: Necessário realizar o login para acessar a página!"
      });

    });
  })


//inicia um servidor web na porta 3000 p acessar digite essa url 
//http://localhost:3000 no navegador
app.listen(3000, () => {
  console.log("Servidor iniciado na porta 3000: http://localhost:3000");
});