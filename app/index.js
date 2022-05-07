const inquirer = require('inquirer');
const chalk = require('chalk');
const moment = require('moment'); 


const log = console.log;
const table = console.table;

let sales = []
let sellers = []

start(true)

async function start(first = false) {

  if (first) {
    log(chalk.blue('Welcome to my sales case'))
  }

  const { menu } = await inquirer.prompt([{
    type: 'list',
    name: 'menu',
    message: 'Menu',
    choices: [
      '1 - Ranking',
      '2 - New Sale',
      '3 - New Seller',
      '4 - List Sales',
      '5 - List Sellers',
      '6 - Exit'
    ]
  }]);

  if (menu.includes('1')) {
    return ranking();
  } else if (menu.includes('2')) {
    return newSale();
  } else if (menu.includes('3')) {
    return newSeller();
  } else if (menu.includes('4')) {
    return listSales();
  } else if (menu.includes('6')) {
    log(chalk.green('Goodbye! :)'))
  }
}

async function newSeller(sale = false) {
  log(chalk.blue('// New Seller'))
  const { name } = await inquirer.prompt([{
    type: 'input',
    name: 'name',
    message: 'Seller name:',
  }]);

  if (!name) {
    log(chalk.red('Invalid name!'))
    return newSeller()
  }

  let createdSeller = {
    id: (sellers.length + 1),
    name,
    sales: []
  }

  sellers.push(createdSeller);

  log(chalk.green('New seller created!'));
  table(sellers, ["id", "name"]);

  if (sale) {
    return newSale(createdSeller);
  } else {
    return start();
  }
}

async function newSale(createdSeller = null) {

  let seller = createdSeller ? `${createdSeller.id} - ${createdSeller.name}` : null;

  if (!createdSeller) {
    if (sellers.length === 0) {
      log(chalk.blue('// First register a seller'));
      return newSeller(true);
    }
  
    log(chalk.blue('// New Sale'))
    let { selectedSeller } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedSeller',
      message: 'Select seller',
      choices: [
        ...sellers.map(s => `${s.id} - ${s.name}`),
        'Return'
      ]
    }]);

    seller = selectedSeller;
  
    if (seller === 'Return') {
      return start();
    }
  } else {
    log(chalk.blue('// New Sale'));
  }

  const {
    client,
    description,
    value
  } = await inquirer.prompt([
    {
      type: 'input',
      name: 'client',
      message: 'Client name:',
      validate: (input) => {
        return !input ? 'Invalid client name' : true
      }
    },
    {
      type: 'input',
      name: 'description',
      message: 'Sale description:',
      validate: (input) => {
        return !input ? 'Invalid description' : true
      }
    },
    {
      type: 'number',
      name: 'value',
      message: 'Value:',
      validate: (input) => {
        return isNaN(input) ? 'Invalid number' : true
      }
    },
  ]);

  const sellerId = seller.split(' - ')[0]
  for (let i = 0; i < sellers.length; i++) {
    if (sellers[i].id === parseFloat(sellerId)) {
      sellers[i].sales.unshift({
        id: await getSaleId(),
        dateTime: moment().format('DD/MM/YYYY HH:mm:ss'),
        client,
        description,
        value,
      });

      log(chalk.green('// Sale created'));
      log(chalk.blue('// Seller sales'));
      table(sellers[i].sales);
      
      let totalValue = 0
      sellers[i].sales.forEach(s => {
        totalValue += s.value
      })

      log(chalk.green(`Amount of sales: ${sellers[i].sales.length}`))
      log(chalk.green(`Total value: ${parseFloat(totalValue.toFixed(2))}`))
    }
  }

  return start();
}

async function listSales() {
  log(chalk.blue('// Sales list (Sorted by descending date)'));

  let { tempSales, totalValue } = await getSales();

  if (tempSales.length === 0) {
    log(chalk.red('No sales created'));
    return start();
  }

  tempSales.sort((a, b) => moment(b.dateTime, 'DD/MM/YYYY HH:mm:ss') - moment(a.dateTime, 'DD/MM/YYYY HH:mm:ss'));

  log(chalk.green(`Amount of sales: ${tempSales.length}`))
  log(chalk.green(`Total value: ${parseFloat(totalValue.toFixed(2))}`))

  const { selectedSale } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedSale',
    message: 'Select sale to edit/delete',
    choices: [
      ...tempSales.map(t => `Id: ${t.id} | DateTime: ${t.dateTime} | Value: ${t.value} | Description: ${t.description} | Client: ${t.client} | Seller: ${t.seller}`),
      'Return'
    ]
  }]);

  if (selectedSale === 'Return') {
    return start();
  } else {
    return selectedSaleOptions(parseFloat(selectedSale.split('|')[0].split(':')[1].trim()))
  }
}

async function selectedSaleOptions(saleId) {
  const { option } = await inquirer.prompt([{
    type: 'list',
    name: 'option',
    message: 'Action',
    choices: [
      '1 - Edit',
      '2 - Delete',
      '3 - Return'
    ]
  }]);

  if (option.includes('1')) {
    let sale = await getSales(saleId)
    return editOptions(saleId, sale)

  } else if (option.includes('2')) {
    return deleteSale(saleId)
  } else {
    return listSales()
  }
}

async function deleteSale(saleId) {
  const { option } = await inquirer.prompt([{
    type: 'list',
    name: 'option',
    message: 'Confirm the deletion of the sale?',
    choices: [
      '1 - Yes',
      '2 - No',
    ]
  }]);

  if (option.includes('1')) {
    for (let i = 0; i < sellers.length; i++) {
      for (let j = 0; j < sellers[i].sales.length; j++) {
        if (sellers[i].sales[j].id === saleId) {
          sellers[i].sales.splice(j, 1)
          log(chalk.green('Sale successfully deleted'))
          return listSales()
        }
      }
    }

  } else {
    return selectedSaleOptions(saleId)
  }
}

async function editOptions(saleId, sale) {
  const { editOption } = await inquirer.prompt([{
    type: 'list',
    name: 'editOption',
    message: 'Action',
    choices: [
      '1 - Edit client name',
      '2 - Edit description',
      '3 - Edit value',
      '4 - Edit seller',
      '5 - Save',
      '6 - Cancel'
    ]
  }]);

  log(chalk.gray(`Id: ${sale.id} | DateTime: ${sale.dateTime} | Value: ${sale.value} | Description: ${sale.description} | Client: ${sale.client} | Seller: ${sale.seller}`))

  if (editOption.includes('1')) {
    const {
      client,
    } = await inquirer.prompt([
      {
        type: 'input',
        name: 'client',
        message: 'Client name:',
        validate: (input) => {
          return !input ? 'Invalid client name' : true
        }
      }
    ])

    sale.client = client
    editOptions(saleId, sale)
  } else if (editOption.includes('2')) {
    const {
      description,
    } = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Sale description:',
        validate: (input) => {
          return !input ? 'Invalid description' : true
        }
      },
    ])

    sale.description = description
    editOptions(saleId, sale)

  } else if (editOption.includes('3')) {
    const {
      value,
    } = await inquirer.prompt([
      {
        type: 'number',
        name: 'value',
        message: 'Value:',
        validate: (input) => {
          return isNaN(input) ? 'Invalid number' : true
        }
      },
    ])

    sale.value = value
    editOptions(saleId, sale)
  
  } else if (editOption.includes('4')) {
    let { selectedSeller } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedSeller',
      message: 'Select seller',
      choices: [
        ...sellers.map(s => `${s.id} - ${s.name}`),
        'Return'
      ]
    }]);

    const sellerId = selectedSeller.split(' - ')[0]
    sale.newSeller = sellerId
    return saveEditedSale(saleId, sale)

  } else if (editOption.includes('5')) {
    return saveEditedSale(saleId, sale)
  } else {
    return selectedSaleOptions(saleId)
  }
}

async function saveEditedSale(saleId, sale) {

  if (sale.newSeller) {
    for (let i = 0; i < sellers.length; i++) {
      for (let j = 0; j < sellers[i].sales.length; j++) {
        if (
          sellers[i].sales[j].id     === saleId &&
          sellers[i].sales[j].seller === sales.seller
        ) {
          sellers[i].sales.splice(j, 1)
        }
      }
      if (sellers[i].id === parseFloat(sale.newSeller)) {
        sellers[i].sales.unshift({
          id: sale.id,
          dateTime: sale.dateTime,
          client: sale.client,
          description: sale.description,
          value: sale.value,
        });
      }
    }
    log(chalk.green('Saved changes!'));
    return listSales()
  } else {
    for (let i = 0; i < sellers.length; i++) {
      for (let j = 0; j < sellers[i].sales.length; j++) {
        if (sellers[i].sales[j].id === saleId) {
          sellers[i].sales[j].description = sale.description;
          sellers[i].sales[j].client = sale.client;
          sellers[i].sales[j].value = sale.value;
  
          log(chalk.green('Saved changes!'));
          return listSales();
        }
      }
    }
  }

}

async function ranking() {
  log(chalk.blue('// Ranking'));
  const { type } = await inquirer.prompt([{
    type: 'list',
    name: 'type',
    message: 'Select ranking type',
    choices: [
      '1 - Amount of sales',
      '2 - Total sales value',
      'Return'
    ]
  }]);

  if (type === 'Return') {
    return start();
  }

  let data = await getRankingData();

  if (data.length === 0) {
    log(chalk.red('No data for ranking'));
    return start();
  }

  if (type.includes('1')) {
    log(chalk.blue('// Ranking (Sorted by amount of sales)'));
    data.sort((a, b) => b.amountSales - a.amountSales);
  } else if (type.includes('2')) {
    log(chalk.blue('// Ranking (Sorted by total sales value)'));
    data.sort((a, b) => b.totalValue - a.totalValue);
  }

  table(data);

  return start();
}

async function getRankingData() {
  let tempRanking = []
  for (let i = 0; i < sellers.length; i++) {
    let totalValue = 0
    sellers[i].sales.forEach(s => {
      totalValue += s.value
    })

    tempRanking.push({
      sellerId: sellers[i].id,
      sellerName: sellers[i].name,
      amountSales: sellers[i].sales.length,
      totalValue
    })
  }

  return tempRanking
}

async function getSaleId() {
  lastId = 0
  for (let i = 0; i < sellers.length; i++) {
    for (let y = 0; y < sellers[i].sales.length; y++) {
      lastId = sellers[i].sales[y].id > lastId ? sellers[i].sales[y].id : lastId
    }
  }

  return (lastId + 1)
}

async function getSales(saleId = null) {
  let tempSales = []
  let totalValue = 0
  for (let i = 0; i < sellers.length; i++) {
    for (let j = 0; j < sellers[i].sales.length; j++) {
      let sale = {
        id: sellers[i].sales[j].id,
        dateTime: sellers[i].sales[j].dateTime,
        value: sellers[i].sales[j].value,
        description: sellers[i].sales[j].description,
        client: sellers[i].sales[j].client,
        seller: sellers[i].name
      }

      if (saleId && sale.id === saleId) {
        return sale
      } else {
        tempSales.push(sale)
      }
      totalValue += sellers[i].sales[j].value
    }
  }

  return {
    tempSales,
    totalValue
  }
}