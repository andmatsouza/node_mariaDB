//importamos o express p podermos criar as rotas
const express = require("express");
//importamos o bcrypt p criptografar a senha
const bcrypt = require("bcryptjs");
//importamos o jonwebtoken usado p gerar o token de autenticação
const jwt = require("jsonwebtoken");
//importamos o módulo para validar o token
const { eAdmin } = require("./middlewares/auth");
//importamos o lib que gerencia as variaveis de ambiente
require("dotenv").config();
//importamos o cors serve para permitir acesso externo a API
const cors = require("cors");
//importamos o yup validar o os dados vindo do front no backend
const yup = require("yup");
//importamos o nodemailer permite enviar e-mails
const nodemailer = require("nodemailer");
//importamos o operador (Op) do sequelizer p usar na clausula where
const { Op } = require("sequelize");

//importamos a model user, objeto que vamos usar p manipular o banco de dados
const User = require("./model/User");

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "X-PINGOTHER, Content-Type, Authorization"
  );
  app.use(cors());
  next();
});

app.use(express.json());

//rotas que a nossa api vai disponibilizar para um cliente(browser, aplicativo, sistema, etc..)

//1ª rota - cadastrar um usúario na tabela users
app.post("/user", eAdmin, async (req, res) => {
  var dados = req.body;

  const schema = yup.object({
    password: yup
      .string()
      .required("Erro: Necessário preencher o campo senha!")
      .min(6, "Erro: A senha deve ter no mínimo 6 caracteres!"),
    email: yup
      .string()
      .email()
      .required("Erro: Necessário preencher o campo email!"),
    name: yup.string().required("Erro: Necessário preencher o campo nome!"),
  });

  try {
    await schema.validate(dados);
  } catch (err) {
    return res.status(400).json({
      erro: true,
      mensagem: err.errors,
    });
  }

  //verifica se o e-mail já está cadastrado no banco
  const user = await User.findOne({
    where: {
      email: req.body.email,
    },
  });

  if (user) {
    return res.status(400).json({
      erro: true,
      mensagem: "Erro: Este e-mail já está cadastrado!",
    });
  }

  dados.password = await bcrypt.hash(dados.password, 8);

  await User.create(dados)
    .then(() => {
      return res.json({
        erro: false,
        mensagem: "Usuário cadastrado com sucesso!",
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Erro: Usuário não cadastrado com sucesso!",
      });
    });
});

//2ª rota - listar todos os usúarios na tabela users
app.get("/users/:page", eAdmin, async (req, res) => {
  // Inicio do código de paginação

  //se não veio numhum valor no parametro page atribui 1
  const { page = 1 } = req.params;
  const limit = 40;
  var lastPage = 1;

  const countUser = await User.count();
  if (countUser === null) {
    return res.status(400).json({
      erro: true,
      mensagem: "Erro: Nenhum usuário encontrado!",
    });
  } else {
    lastPage = Math.ceil(countUser / limit);
  }
  //fim da paginação - OBS: os atributos offset e limit(findAll) fazem parte da paginação

  await User.findAll({
    attributes: ["id", "name", "email", "password"],
    order: [["id", "DESC"]],
    offset: Number(page * limit - limit),
    limit: limit,
  })
    .then((users) => {
      return res.json({
        erro: false,
        users,
        countUser,
        lastPage,
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Erro: Nenhum usuário encontrado!",
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
        user: user,
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Erro: Nenhum usuário encontrado!",
      });
    });
});

//4ª rota - atualizar um usúario pelo seu id na tabela users
app.put("/user", eAdmin, async (req, res) => {
  const { id } = req.body;

  const schema = yup.object({
    //password: yup.string().required("Erro: Necessário preencher o campo senha!")
    // .min(6, "Erro: A senha deve ter no mínimo 6 caracteres!"),
    email: yup
      .string()
      .email()
      .required("Erro: Necessário preencher o campo email!"),
    name: yup.string().required("Erro: Necessário preencher o campo nome!"),
  });

  try {
    await schema.validate(req.body);
  } catch (err) {
    return res.status(400).json({
      erro: true,
      mensagem: err.errors,
    });
  }

  //verifica se o e-mail já está cadastrado no banco
  const user = await User.findOne({
    where: {
      email: req.body.email,
      id: {
        [Op.ne]: id,
      },
    },
  });

  if (user) {
    return res.status(400).json({
      erro: true,
      mensagem: "Erro: Este e-mail já está cadastrado!",
    });
  }

  await User.update(req.body, { where: { id } })
    .then(() => {
      return res.json({
        erro: false,
        mensagem: "Usuário editado com sucesso!",
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Erro: Usuário não editado com sucesso!",
      });
    });
});

//5ª rota - apagar um usúario pelo seu id na tabela users
app.delete("/user/:id", eAdmin, async (req, res) => {
  const { id } = req.params;

  await User.destroy({ where: { id } })
    .then(() => {
      return res.json({
        erro: false,
        mensagem: "Usuário apagado com sucesso!",
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Erro: Usuário não apagado com sucesso!",
      });
    });
});

//6ª rota - atualizar a senha do usúario na tabela users
app.put("/user-senha", eAdmin, async (req, res) => {
  const { id, password } = req.body;

  const schema = yup.object({
    password: yup
      .string()
      .required("Erro: Necessário preencher o campo senha!")
      .min(6, "Erro: A senha deve ter no mínimo 6 caracteres!"),
  });

  try {
    await schema.validate(req.body);
  } catch (err) {
    return res.status(400).json({
      erro: true,
      mensagem: err.errors,
    });
  }

  var senhaCrypt = await bcrypt.hash(password, 8);

  await User.update({ password: senhaCrypt }, { where: { id } })
    .then(() => {
      return res.json({
        erro: false,
        mensagem: "Senha editada com sucesso!",
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Erro: Senha não editada com sucesso!",
      });
    });
});

//7ª rota - login de um usuário
app.post("/login", async (req, res) => {
  /*await sleep(3000);

    function sleep(ms) {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    };*/

  const user = await User.findOne({
    attributes: ["id", "password", "email", "name"],
    where: { email: req.body.email },
  });
  if (user === null) {
    return res.status(400).json({
      erro: true,
      mensagem: "Erro: Usuário ou senha incorreta!",
    });
  }

  if (!(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(400).json({
      erro: true,
      mensagem: "Erro: Usuário ou senha incorreta!",
    });
  }

  const token = jwt.sign(
    { id: user.id /*levelAccess: 1*/ },
    process.env.SECRET,
    {
      // expiresIn: 600 //10 min
      expiresIn: "7d",
    }
  );

  return res.json({
    erro: false,
    mensagem: "Login realizado com sucesso!",
    token,
  });
});

//8ª rota - validar o token
app.get("/val-token", eAdmin, async (req, res) => {
  await User.findByPk(req.userId, { attributes: ["id", "name", "email"] })
    .then((user) => {
      return res.json({
        erro: false,
        user,
        // mensagem: "Token válido! Id do usuário: " + req.userId + ". Nível de acesso: " + req.levelAccess
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Erro: Necessário realizar o login para acessar a página!",
      });
    });
});

//9ª rota - para visualizar o perfil de um usuário
app.get("/view-profile", eAdmin, async (req, res) => {
  const id = req.userId;

  await User.findByPk(id)
    .then((user) => {
      return res.json({
        erro: false,
        user: user,
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Erro: Nenhum usuário encontrado!",
      });
    });
});

//10ª rota - atualizar o perfil do usúario
app.put("/edit-profile", eAdmin, async (req, res) => {
  //pegando o id que vem do token - middlewares - auth - req.userId = decoded.id
  const id = req.userId;

  const schema = yup.object({
    email: yup
      .string()
      .email()
      .required("Erro: Necessário preencher o campo email!"),
    name: yup.string().required("Erro: Necessário preencher o campo nome!"),
  });

  try {
    await schema.validate(req.body);
  } catch (err) {
    return res.status(400).json({
      erro: true,
      mensagem: err.errors,
    });
  }

  //verifica se o e-mail já está cadastrado no banco
  const user = await User.findOne({
    where: {
      email: req.body.email,
      id: {
        [Op.ne]: id,
      },
    },
  });

  if (user) {
    return res.status(400).json({
      erro: true,
      mensagem: "Erro: Este e-mail já está cadastrado!",
    });
  }

  await User.update(req.body, { where: { id } })
    .then(() => {
      return res.json({
        erro: false,
        mensagem: "Perfil editado com sucesso!",
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Erro: Perfil não editado com sucesso!",
      });
    });
});

//11ª rota - Editar a senha do perfil
app.put("/edit-profile-password", eAdmin, async (req, res) => {
  //pegando o id que vem do token - middlewares - auth - req.userId = decoded.id
  const id = req.userId;
  const { password } = req.body;

  const schema = yup.object({
    password: yup
      .string()
      .required("Erro: Necessário preencher o campo senha!")
      .min(6, "Erro: A senha deve ter no mínimo 6 caracteres!"),
  });

  try {
    await schema.validate(req.body);
  } catch (err) {
    return res.status(400).json({
      erro: true,
      mensagem: err.errors,
    });
  }

  var senhaCrypt = await bcrypt.hash(password, 8);

  await User.update({ password: senhaCrypt }, { where: { id } })
    .then(() => {
      return res.json({
        erro: false,
        mensagem: "Senha editada com sucesso!",
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Erro: Senha não editada com sucesso!",
      });
    });
});

//12ª rota - cadastrar um usúario na página de login
app.post("/add-user-login", async (req, res) => {
  var dados = req.body;

  const schema = yup.object({
    password: yup
      .string()
      .required("Erro: Necessário preencher o campo senha!")
      .min(6, "Erro: A senha deve ter no mínimo 6 caracteres!"),
    email: yup
      .string()
      .email()
      .required("Erro: Necessário preencher o campo email!"),
    name: yup.string().required("Erro: Necessário preencher o campo nome!"),
  });

  try {
    await schema.validate(dados);
  } catch (err) {
    return res.status(400).json({
      erro: true,
      mensagem: err.errors,
    });
  }

  //verifica se o e-mail já está cadastrado no banco
  const user = await User.findOne({
    where: {
      email: req.body.email,
    },
  });

  if (user) {
    return res.status(400).json({
      erro: true,
      mensagem: "Erro: Este e-mail já está cadastrado!",
    });
  }

  dados.password = await bcrypt.hash(dados.password, 8);

  await User.create(dados)
    .then(() => {
      return res.json({
        erro: false,
        mensagem: "Usuário cadastrado com sucesso!",
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Erro: Usuário não cadastrado com sucesso!",
      });
    });
});

//13ª rota - Recuperar a senha do usuário
app.post("/recover-password", async (req, res) => {

  var transport = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

var message = {
  from: "andmatsou@gmail.com",
  to: "cpaexadm@gmail.com",
  subject: "Instrução para recuperar a senha",
  text: `Prezado(a) Anderson.\n\nVocê solicitou alteração de senha.\n\n
         Para continuar o seu processo de recuperação de senha, clique no link 
         abaixo ou cole o endereço no seu navegador:\n\nSe você não solicitou
         essa alteração, nenhuma ação é necessária. Sua senha permanecerá a mesma 
         até que você ative este código.\n\n`,
  html: `Prezado(a) Anderson.<br><br>Você solicitou alteração de senha.<br><br>
         Para continuar o seu processo de recuperação de senha, clique no link 
         abaixo ou cole o endereço no seu navegador:<br><br>Se você não solicitou
         essa alteração, nenhuma ação é necessária. Sua senha permanecerá a mesma 
         até que você ative este código.<br><br>`
};

await transport.sendMail(message, function(err) {
  if(err) return res.status(400).json({
      erro: true,
      mensagem: "Erro: E-mail não enviado com sucesso!"
  });

  return res.json({
    erro: false,
    mensagem: "E-mail enviado com sucesso!"
  });
});


  /*const user = await User.findOne({
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
  }*/

  //const token = jwt.sign({id: user.id, /*levelAccess: 1*/}, process.env.SECRET, {
  // expiresIn: 600 //10 min
  //  expiresIn: '7d'
  //})

  /*return res.json({
    erro: false,
    mensagem: "Login realizado com sucesso!",
    token
});*/
});

//inicia um servidor web na porta 3000 p acessar digite essa url
//http://localhost:3000 no navegador
app.listen(3000, () => {
  console.log("Servidor iniciado na porta 3000: http://localhost:3000");
});
