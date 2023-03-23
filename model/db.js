//importamos o sequelize p conectar ao banco de dados
const Sequelize = require("sequelize");

//criamos a nossa string de conexão
const sequelize = new Sequelize('sigap', 'root', '123456', {
  host: 'localhost', 
  dialect: 'mariadb',
  port: '3305'  
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