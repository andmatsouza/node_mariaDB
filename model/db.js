//importamos o sequelize p conectar ao banco de dados
const Sequelize = require("sequelize");

//criamos a nossa string de conexão
const sequelize = new Sequelize(process.env.DB, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST, 
  dialect: 'mysql',    
});

//verifica se conectou com sucesso
sequelize.authenticate()
.then(() =>{
  console.log('Connection has been established successfully.');
})  
.catch((error) =>{
  console.error('Unable to connect to the database:', error);
}) ;
  

//exportamos a const Sequelize p usarmos em outros módulos
module.exports = sequelize;