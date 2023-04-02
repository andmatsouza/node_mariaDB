//importamos o sequelize p conectar ao banco de dados
const Sequelize = require("sequelize");

//criamos a nossa string de conexão sem a variavel de ambiente env.
// const sequelize = new Sequelize('sigap', 'root', '123456', {
//   host: 'localhost', 
//   dialect: 'mysql',  
// });

//criamos a nossa string de conexão
const sequelize = new Sequelize(process.env.DB, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST, 
  dialect: 'mysql',    
});

//verifica se conectou com sucesso
sequelize.authenticate()
.then(() =>{
  console.log('Conexão com o banco de dados realizada com sucesso!.');
})  
.catch((error) =>{
  console.error('Conexão com o banco de dados não realizada com sucesso!.', error);
}) ;
  

//exportamos a const Sequelize p usarmos em outros módulos
module.exports = sequelize;