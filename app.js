//importamos o express p podermos criar as rotas
const express = require("express");
//importamos o bcrypt p criptografar a senha
const bcrypt = require("bcryptjs");
//importamos o jonwebtoken usado p gerar o token de autenticação
const jwt = require("jsonwebtoken");
//importamos o módulo para validar o token
const { eAdmin } = require("./middlewares/auth");
//importamos o middleware q manipula imagens
const upload = require('./middlewares/uploadImgProfile');
//importamos o lib que gerencia as variaveis de ambiente
require("dotenv").config();
//importamos o fs do node trabalha com arquivos
const fs = require('fs');
//importamos path permitir q outras requisições tenha acesso as imagens
const path = require('path');
//importamos o cors serve para permitir acesso externo a API
const cors = require("cors");
//importamos o yup validar o os dados vindo do front no backend
const yup = require("yup");
//importamos o nodemailer permite enviar e-mails
const nodemailer = require("nodemailer");


//importamos a model user, objeto que vamos usar p manipular o banco de dados
const User = require("./model/User");
const { Op } = require("sequelize");

//exercutamos o express p poder criar as rotas
const app = express();
//liberar permissão para aplicações externas acessarem a API - o cors tb é um middlewares - é executdo antes de qualquer instrução
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

//aceita os dados em formato json
app.use(express.json());

//permite frontend acessar as imagens no backend
app.use('/files', express.static(path.resolve(__dirname, "public", "upload")))

//rotas que a nossa api vai disponibilizar para um cliente(browser, aplicativo, sistema, etc..)

//1ª rota - cadastrar um usúario na tabela users - async e await
app.post("/user", eAdmin, async (req, res) => {
  var dados = req.body;
  //2º passo - validar os campos enviados pelo formulário usando o yup
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

  //3º passo - verifica se o e-mail já está cadastrado no banco
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
  //4º passo - criptografar a senha usando o bcrypt
  dados.password = await bcrypt.hash(dados.password, 8);

  //1º passo - cadastrar o usuário no banco 
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
  const limit = 7;
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

  //1º passo - retorna todos os registros da tabela users
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

  //1º passo - buscar o usuário na tabela de acordo com o seu id
  //await User.findAll({ where: { id: id } })
  await User.findByPk(id)
    .then((user) => {
      //comentar mais tarde junto com a ementa do frontend
      if(user.image){
        var endImage = process.env.URL_IMG + "/files/users/" + user.image;
      }else{
        var endImage = process.env.URL_IMG + "/files/users/icone_usuario.png";
      }

      return res.json({
        erro: false,
        user: user,
        endImage
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
  //2º passo - validar com o yup
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

  //3º passo - verifica se o e-mail já está cadastrado no banco
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

  //1º passo - atualizar o usuário no banco
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
  //1º passo - deletar o usuário
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
  //1º passo - busca o usuario no banco 
 //= sql gerado: Select id,password,... from users where email = "andmatsou@gmail.com"
  const user = await User.findOne({
    attributes: ["id", "password", "email", "name", "image"],
    where: { email: req.body.email },
  });
  //se não encontrou o usuário retorna mensagem
  if (user === null) {
    return res.status(400).json({
      erro: true,
      mensagem: "Erro: Usuário ou senha incorreta!",
    });
  }
  //2º passo - comapara a senha q usuario tem no banco com a que esta enviando
  if (!(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(400).json({
      erro: true,
      mensagem: "Erro: Usuário ou senha incorreta!",
    });
  }

  //3º passo - gerar o token
  //gerando o token e só pode validar o token quem tiver a chave (gerar uma chave única)
  //api recebe a requisição verifica se a senha é válida e retorna o token para a requisição q solicitou q deve ser salva no localstorage
  //toda vez q a aplicação fizer uma requisição p rotas privadas deve informar o token q esta armazenado no localstorage.
  const token = jwt.sign(
    { id: user.id /*levelAccess: 1*/ },
    process.env.SECRET,
    {
      // expiresIn: 600 //10 min
      expiresIn: "7d",
    }
  );

  //comentar junto com o frontend
  const {name, image} = user;

  if(user.image){
    var endImage = process.env.URL_IMG + "/files/users/" + image;
  }else{
    var endImage = process.env.URL_IMG + "/files/users/icone_usuario.png";
  }

  return res.json({
    erro: false,
    mensagem: "Login realizado com sucesso!",
    token,
    user: {name, image: endImage}
  });
});

//8ª rota - validar o token - eAdmin valida o token, porem se o token tem um prazo de validade (ex: 1 hr, se o usuario for excluido durante este periodo
//a rota verifica se o usuario está cadastrado, caso não ele é redirecionado p o login)
app.get("/val-token", eAdmin, async (req, res) => {
  //pode recuperar o id do usuario que foi gerado junto com o token na rota login - recupera em req.userId
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
    
      if(user.image){
        var endImage = process.env.URL_IMG + "/files/users/" + user.image;
      }else{
        var endImage = process.env.URL_IMG + "/files/users/icone_usuario.png";
      }
      
      return res.json({
        erro: false,
        user: user,
        endImage
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

  var dados = req.body;

  //verifica se o e-mail já está cadastrado no banco
   const user = await User.findOne({
    attributes:['id', 'email', 'name'], 
    where: {email: dados.email}
  });

  if(user === null){
    return res.status(400).json({
      erro: true,
      mensagem: "Erro: Usuário não encontrado!"
  });
  }

  //gerar a chave p usuário recuperar a senha
  dados.recover_password = (await bcrypt.hash(user.id + user.name + user.email, 8)).replace(/\./g, "").replace(/\//g, "")

  await User.update(dados, { where: { id: user.id } })
    .then(() => {
      var transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      var message = {
        from: process.env.EMAIL_FROM_PASS,
        to: dados.email,
        subject: "Instrução para recuperar a senha",
        text: `Prezado(a) Anderson.\n\nVocê solicitou alteração de senha.\n\n
               Para continuar o seu processo de recuperação de senha, clique no link 
               abaixo ou cole o endereço no seu navegador: ${dados.url} 
               ${dados.recover_password} \n\nSe você não solicitou
               essa alteração, nenhuma ação é necessária. Sua senha permanecerá a mesma 
               até que você ative este código.\n\n`,
        // html: `Prezado(a) Anderson.<br><br>Você solicitou alteração de senha.<br><br>
        //        Para continuar o seu processo de recuperação de senha, clique no link 
        //        abaixo ou cole o endereço no seu navegador: <a href='${dados.url}
        //        ${dados.recover_password}'>${dados.url}
        //        ${dados.recover_password}</a><br><br>Se você não solicitou
        //        essa alteração, nenhuma ação é necessária. Sua senha permanecerá a mesma 
        //        até que você ative este código.<br><br>`
        html: `<a href="${dados.url}${dados.recover_password}">${dados.url}${dados.recover_password}</a>`
      };
      
      transport.sendMail(message, function(err) {
        if(err) return res.status(400).json({
            erro: true,
            mensagem: "Erro: E-mail com instruções para recuperar a senha não enviado, tente novamente!"
        });
      
        return res.json({
          erro: false,
          mensagem: "Enviado e-mail com instruções para recuperar a senha. Acesse a sua caixa de e-mail!"
        });
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Erro: E-mail com instruções para recuperar a senha não enviado, tente novamente!",
      });
    });
 
});

//14ª rota - Validar a key e recuperar a senha do usuário
app.get("/val-key-recover-pass/:key", async (req, res) => {

  const {key} =req.params;

  //verifica se o e-mail já está cadastrado no banco
  const user = await User.findOne({
    attributes:['id'], 
    where: {recover_password: key}
  });

  if(user === null){
    return res.status(400).json({
      erro: true,
      mensagem: "Erro: Link inválido!"
  });
  }



  return res.json({
    erro: false,
    mensagem: "Chave válida!"   
  });
 
});

//15ª rota - Atualiza a senha do usuario recuperada
app.put("/update-password/:key", async (req, res) => {
  const {key} = req.params;
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

  //password: senhaCrypt, recover_password: null - atualiza a senha e atribui null na coluna recover_password
  await User.update({ password: senhaCrypt, recover_password: null }, { where: { recover_password: key } })
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

//16ª rota - Editar imagem no perfil
app.put('/edit-profile-image', eAdmin, upload.single('image'), async (req, res) => {
  if(req.file){
    //console.log(req.file);

    await User.findByPk(req.userId)
    .then(user => {
        const imgOld = "./public/upload/users/" + user.dataValues.image;
        //excluir a img antiga do perfil do usuario
        fs.access(imgOld, (err) => {
          if(!err){
            fs.unlink(imgOld, () => {})
          }
        });
    }).catch(() => {
      return res.json({
        erro: false,
        mensagem: "Erro: Perfil não encontrado!",
      });
    });    

    await User.update({image: req.file.filename}, { where: { id: req.userId } })
    .then(() => {
      return res.json({
        erro: false,
        mensagem: "Imagem do perfil editado com sucesso!",
        image: process.env.URL_IMG + "/files/users/" + req.file.filename
      });
    })
    .catch(() => {
      return res.status(400).json({
        erro: true,
        mensagem: "Erro: Imagem do perfil não editado com sucesso!",
      });
    });

  }else{
    return res.status(400).json({
      erro: false,
      mensagem: "Erro: Selecione uma imagem válida JPEG ou PNG!",
    });
  }
  
});

//17ª rota - Editar imagem do usuario
app.put('/edit-user-image/:id', eAdmin, upload.single('image'), async (req, res) => {
  if(req.file){
      const { id } = req.params;

      await User.findByPk(id)
      .then(user => {
          const imgOld = "./public/upload/users/" + user.dataValues.image;

          fs.access(imgOld, (err) => {
              if(!err){
                  fs.unlink(imgOld, () => {});
              }
          });

      }).catch(() => {
          return res.status(400).json({
              erro: true,
              mensagem: "Erro: Usuário não encontrado!"
          });
      });

      await User.update({image: req.file.filename}, { where: { id: id } })
      .then(() => {
          return res.json({
              erro: false,
              mensagem: "Imagem do usuário editado com sucesso!",
          });

      }).catch(() => {
          return res.status(400).json({
              erro: true,
              mensagem: "Erro: Imagem do usuário não editado com sucesso!"
          });
      });
  }else{
      return res.status(400).json({
          erro: false,
          mensagem: "Erro: Selecione uma imagem válida JPEG ou PNG!"
      });
  }
  
});


//inicia um servidor web na porta 3000 p acessar digite essa url
//http://localhost:3000 no navegador
app.listen(3000, () => {
  console.log("Servidor iniciado na porta 3000: http://localhost:3000");
});
