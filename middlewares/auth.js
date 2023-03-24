const jwt = require("jsonwebtoken");
const { promisify } = require("util");
//importamos o lib que gerencia as variaveis de ambiente
require('dotenv').config();

module.exports = {
  eAdmin: async function (req, res, next){
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
     const decoded = await promisify(jwt.verify)(token, process.env.SECRET);
     req.userId = decoded.id;
     return next(); 
    } catch (err) {
      return res.status(400).json({
        erro: true,
        mensagem: "Erro: Necessário realizar o login para acessar a página!"
    });
    }  
  }
};