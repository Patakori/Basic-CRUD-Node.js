//Importanção do express
const express = require("express")

//Gerador de id
const { v4: uuidv4 } = require("uuid")

//Passando o express pra uma constante
const app = express();

//Passsando pra app a função de aceitar json
app.use(express.json());

//Array simulando banco de dados
const customers = [];

//Middleware
function verifyExistAccountCPF(request, response, next){
  //Constante que vem de params
  const { cpf } = request.headers;

  //Procurando o cpf existente
  const customer = customers.find(customer => customer.cpf === cpf);

  //Verificar se o cpf existe
  if(!customer){
    return response.status(400).json({ error: "Customer not found"});
  }

  //Para disponibilizar a constante customer para todas as funções que o middleware for chamado
  request.customer = customer

  return next();
}

//Para atualizar o valor de statement tanto saque como deposito
function getBalance(statement){
  //transformar todos os valores em apenas um valor
  const balance = statement.reduce((acc, operation)=>{
    if(operation.type === 'credit'){
      return acc + operation.amount;
    }else{
      return acc - operation.amount;
    }
  },0)
  return balance
}

//Metodo Post
app.post("/account", (request, response)=>{
  //Constantes que vem do body
  const { cpf, name } = request.body;

  //Verificando se o cpf já existe
  const customerAlreadyExists = customers.some((customer)=> customer.cpf === cpf);

  if(customerAlreadyExists){
    return response.status(400).json({error: "Customer already exists!"})
  }

  //Criando um novo user
  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement:[]
  });

  return response.status(201).send();

});

//Todas as rotas abaixo do app.use vão ter a fução verify
//app.use(verifyExistAccountCPF);

//Metodo Get
app.get("/statement", verifyExistAccountCPF, (request, response)=>{

  //Pegando a constante do middleware
  const { customer } = request;

  return response.json(customer.statement);

});

//Depositar dinheiro
app.post("/deposit", verifyExistAccountCPF, (request, response) => {
  const { description, amount } = request.body

  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  }

  customer.statement.push(statementOperation)

  return response.status(201).send()
});

//Sacar dinheiro
app.post("/withdraw", verifyExistAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);

    if(balance < amount){
      return response.status(400).json({error:"Insuficient funds!"})  
    }

    const statementOperation = {
      amount,
      created_at: new Date(),
      type:"debit",
    }

    customer.statement.push(statementOperation);

    return response.status(201).send()
});

app.get("/statement/date", verifyExistAccountCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query; 

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString());

  return response.json(statement)
});

app.put("/account", verifyExistAccountCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(201).send();
})

app.get("/account", verifyExistAccountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});

app.delete("/account", verifyExistAccountCPF, (request, response) => {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(200).json(customers)
});

app.get("/balance", verifyExistAccountCPF, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json(balance);
})

//Qual porta seu projeto vai rodar
app.listen(3333);

