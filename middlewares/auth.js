const jwt = require("jsonwebtoken");
const { promisify } = require("util");
//importamos o lib que gerencia as variaveis de ambiente
require('dotenv').config();

module.exports = {
  eAdmin: async function (req, res, next){
    //return res.json({menssagem: "Validar token"})
    //obtem o token q vem na requisição pelo haeder Authorization
    const authHeader = req.headers.authorization;

    //verifica se existe um token
    if(!authHeader){
      return res.status(400).json({
        erro: true,
        mensagem: "Erro: Necessário realizar o login para acessar a página!"
    });
    };
    
    //token: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNjgwMzYxMzI3LCJleHAiOjE2ODA5NjYxMjd9.K_sWSHzimiKaYP_E_MHOzRVcymN0gHVw52nwyx2Q7ts
    const [bearer, token] = authHeader.split(' ');
  
    //verifica se existe o token
    if(!token){
      return res.status(400).json({
        erro: true,
        mensagem: "Erro: Necessário realizar o login para acessar a página!"
    });
    };
    
    try {
     const decoded = await promisify(jwt.verify)(token, process.env.SECRET);
     //recupera o id do usuario q foi gerado junto com o token, bem como qualquer outra informação q vc crie no token (ex: levelAcess)
     req.userId = decoded.id;
     //req.levelAccess = decoded.levelAccess;
     return next(); 
    } catch (err) {
      return res.status(400).json({
        erro: true,
        mensagem: "Erro: Necessário realizar o login para acessar a página!"
    });
    }  
  }
};