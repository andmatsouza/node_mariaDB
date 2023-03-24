//importamos o express p podermos criar as rotas
const express = require("express");
//importamos o bcrypt p criptografar a senha
const bcrypt = require('bcryptjs'); 
//importamos o jonwebtoken usado p gerar o token de autenticação
const jwt = require("jsonwebtoken");
//importamos o promisify transforma uma função callback em promisse
const {promisify} = require("util");

//importamos a model user, objeto que vamos usar p manipular o banco de dados 
const User = require("./model/User");

const app = express();
app.use(express.json());

//rotas que a nossa api vai disponibilizar para um cliente(browser, aplicativo, sistema, etc..)

//1ª rota - cadastrar um usúario na tabela users
app.post("/user", validarToken, async (req, res) => {
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
app.get("/users", validarToken, async (req, res) => {

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
app.get("/user/:id", validarToken, async (req, res) => {
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
app.put("/user", validarToken, async (req, res) => {
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
app.delete("/user/:id", validarToken, async (req, res) => {
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
app.put("/user-senha", validarToken, async (req, res) => {
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
  const user = await User.findOne({
    attributes:['id', 'password', 'email', 'name'], 
    where: {email: req.body.email}
  });
  if(user === null){
    return res.status(400).json({
      erro: true,
      mensagem: "Erro: Usuário não encontrado!"
  });
  }

  if(!(await bcrypt.compare(req.body.password, user.password))){
    return res.status(400).json({
      erro: true,
      mensagem: "Erro: Senha inválida!"
  });
  }

 const token = jwt.sign({id: user.id}, '70[?Bh3/-<$ikhNG{6-@`#pMNx.>lg}u"x)/{au.ex~Y9+B<*_(Zl|u:qgSfA*zi', {
   // expiresIn: 600 //10 min
    expiresIn: '7d'
  })

  return res.json({
    erro: false,
    mensagem: "Login realizado com sucesso!",
    token
});
});

//função para validar o token
async function validarToken(req, res, next){
  //return res.json({menssagem: "Validar token"})
  const authHeader = req.headers.authorization;
  const [bearer, token] = authHeader.split(' ');

  if(!token){
    return res.status(400).json({
      erro: true,
      mensagem: "Erro: Necessário realizar o login para acessar a páginaaaaa!"
  });
  }

  try {
   const decoded = await promisify(jwt.verify)(token, '70[?Bh3/-<$ikhNG{6-@`#pMNx.>lg}u"x)/{au.ex~Y9+B<*_(Zl|u:qgSfA*zi');
   req.userId = decoded.id;
   return next(); 
  } catch (err) {
    return res.status(400).json({
      erro: true,
      mensagem: "Erro: Necessário realizar o login para acessar a página!"
  });
  }
  return res.json({menssagem: token}); 
}

//inicia um servidor web na porta 3000 p acessar digite essa url 
//http://localhost:3000 no navegador
app.listen(3000, () => {
  console.log("Servidor iniciado na porta 3000: http://localhost:3000");
});