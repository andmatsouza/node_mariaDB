//importamos o sequelize 
const Sequelize = require("sequelize");
//importamos o módulo de conexão ao banco
const db = require("./db");
//crianmos a tabela users no banco de dados usando o sequelize
const User = db.define('users', {
  id:{
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  password: {
      type: Sequelize.STRING
  },
  recover_password: {
    type: Sequelize.STRING
  },
  image: {
    type: Sequelize.STRING
  }
});

//função do sequelize usada p criar a tabela no banco de dados
//User.sync();
//Verificar se há alguma diferença na tabela, realiza a alteração
//User.sync({ alter: true });

//exportamos a const User p usarmos em outros módulos
module.exports = User;