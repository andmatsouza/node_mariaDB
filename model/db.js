const Sequelize = require("sequelize");

const sequelize = new Sequelize('sigap', 'root', '123456', {
  host: 'localhost', 
  dialect: 'mariadb',
  port: '3305'  
});

sequelize.authenticate()
.then(() =>{
  console.log('Connection has been established successfully.');
})  
.catch((error) =>{
  console.error('Unable to connect to the database:', error);
}) ;
  


module.exports = sequelize;