require('core-js/stable');
require('regenerator-runtime/runtime');
const archiver = require('archiver');
const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
//const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('.'));

const dbConfig = {
  server: '127.0.0.1',
  user: 'HUT',
  password: 'hut1',
  database: 'HUT2',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//-------------------EXECUTE-SQL-QUERIES-/-RETURN-RESULTS------------------------
async function executeQuery(query) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(query);
    sql.close();
    return result.recordset;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
//---------------------------GET-DEFAULT-VALUES----------------------------------
app.get('/getMachines', async (req, res) => {
  try {
    const query = `SELECT DISTINCT Pink FROM vw_PROD_Machines`;
    const result = await executeQuery(query);
    const machines = [...new Set(result.map(item => item.Pink))];

    res.json(machines);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching machines');
  }
});

app.get('/getOperators', async (req, res) => {
  try {
    const query = `SELECT DISTINCT Operator FROM vw_PROD_MachineOperators`;
    const result = await executeQuery(query);
    const operators = [...new Set(result.map(item => item.Operator))];

    res.json(operators);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching operators');
  }
});

app.get('/getOperations', async (req, res) => {
  try {
    const query = `SELECT DISTINCT Operation FROM vw_PROD_MachineOperations`;
    const result = await executeQuery(query);
    const operations = [...new Set(result.map(item => item.Operation))];

    res.json(operations);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching operations');
  }
});


app.get('/getProducts', async (req, res) => {
  try {
    const query = `SELECT DISTINCT Product FROM vw_PROD_MachineProduct`;
    const result = await executeQuery(query);
    const products = [...new Set(result.map(item => item.Product))];

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching machines');
  }
});

//---------------------------------------GET-DATA-BY-MACHINE----------------------------------


app.get('/getOperatorsByMachine', async (req, res) => {
  try {
    const selectedMachine = req.query.machine;
    const query = `SELECT DISTINCT Operator FROM vw_PROD_MachineOperators WHERE Machine = '${selectedMachine}'`;
    const result = await executeQuery(query);
    const operators = [...new Set(result.map(item => item.Operator))];

    res.json(operators);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching operators by machine');
  }
});

app.get('/getOperationsByMachine', async (req, res) => {
  try {
    const selectedMachine = req.query.machine;
    const query = `SELECT DISTINCT Operation FROM vw_PROD_MachineOperations WHERE Machine = '${selectedMachine}'`;
    const result = await executeQuery(query);
    const operations = [...new Set(result.map(item => item.Operation))];

    res.json(operations);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching operations by machine');
  }
});

app.get('/getProductsByMachine', async (req, res) => {
  try {
    const selectedMachine = req.query.machine;
    const query = `SELECT DISTINCT Product FROM vw_PROD_MachineProduct WHERE Machine = '${selectedMachine}'`;
    const result = await executeQuery(query);
    const products = [...new Set(result.map(item => item.Product))];

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching products by machine');
  }
});


//-----------------------------------GET-TABLE-DATA------------------------------------------
app.get('/getTableData', async (req, res) => {
  try {
    const filterCriteria = req.query;
    const queryColumns = 'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = \'vw_PROD_MachiningEvents\'';
    let query = 'SELECT TOP(20) * FROM vw_PROD_MachiningEvents WHERE 1=1';

    if (filterCriteria.machine) {
      query += ` AND Pink = '${filterCriteria.machine}'`;
    }
    if (filterCriteria.operator) {
      query += ` AND Operaator = '${filterCriteria.operator}'`;
    }
    if (filterCriteria.filterDate) {
      query += ` AND Kuupäev = '${filterCriteria.filterDate}'`;
    }
    if (filterCriteria.filterTellimus) {
      query += ` AND Tellimus = '${filterCriteria.filterTellimus}'`;
    }
    if (filterCriteria.filterOperaator) {
      query += ` AND Operaator = '${filterCriteria.filterOperaator}'`;
    }
    if (filterCriteria.filterKlient) {
      query += ` AND Klient = '${filterCriteria.filterKlient}'`;
    }
    query += ' ORDER BY Kuupäev DESC';

    const [columns, data] = await Promise.all([
      executeQuery(queryColumns),
      executeQuery(query),
    ]);

    res.json({ columns, data });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching data from SQL server');
  }
});


//--------------------------------SUBMIT-FORM-DATA-----------------------------------------
app.post('/submitFormData', async (req, res) => {
  try {
    const { pink, toode, klient, operaator, kogus, tellimus, kasi, pos, operatsioon, selectedDate } = req.body;

    async function executeInsertQuery(query) {
      try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
          .input('selectedDate', sql.Date, selectedDate)
          .input('tellimus', sql.NVarChar, tellimus)
          .input('pos', sql.NVarChar, pos)
          .input('klient', sql.NVarChar, klient)
          .input('toode', sql.NVarChar, toode)
          .input('operatsioon', sql.NVarChar, operatsioon)
          .input('kogus', sql.Int, kogus)
          .input('kasi', sql.NVarChar, kasi)
          .input('operaator', sql.NVarChar, operaator)
          .input('pink', sql.NVarChar, pink)
          .query(query);
        sql.close();
      } catch (err) {
        console.error(err);
        throw err;
      }
    }

    const insertQuery = `
      INSERT INTO PROD_MachiningEvents ([Date], [Order], [Position], [Client], [Product], [Operation], [Amount], [OpeningSide], [Operator], [Machine])
      VALUES (@selectedDate, @tellimus, @pos, @klient, @toode, @operatsioon, @kogus, @kasi, @operaator, @pink)
    `;

    await executeInsertQuery(insertQuery);

    res.status(200).send('Form data submitted successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error submitting form data');
  }
});

//--------------------------------SEARCH-BY-ORDER-NUMBER-------------------------------------
//Order PDF files
app.get('/openPdfFiles', (req, res) => {
  const searchString = req.query.searchString;

  if (!searchString) {
    res.status(400).send('Search string is required.');
    return;
  }

  const drivePath = 'E:\\'; // Replace with actual drive path
  const matchingFiles = searchDriveForFiles(drivePath, searchString);

  if (matchingFiles.length > 0) {
    const zip = archiver('zip');
    matchingFiles.forEach(filePath => {
      const fileName = path.basename(filePath);
      zip.file(filePath, { name: fileName });
    });

    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', `attachment; filename="files.zip"`);

    zip.on('error', function(err) {
      res.status(500).send({error: err.message});
    });

    zip.pipe(res);
    zip.finalize();
  } else {
    res.status(404).send('No matching files found.');
  }
});
//Drawing PDF files
app.get('/openDrwFile', (req, res) => {
  const searchString = req.query.searchString;

  if (!searchString) {
    res.status(400).send('Search string is required.');
    return;
  }

  const drivePath = 'E:\\'; // Replace with actual drive path
  const filePath = searchDriveForFile(drivePath, searchString);
  const fileName = path.basename(filePath);

  if (filePath) {
    res.set('Content-Disposition', `attachment; filename="${fileName}"`);
    //openPdfFile(filePath);
    res.sendFile(filePath);
  } else {
    res.status(404).send('No matching file found.');
  }
});

let permissionErrorDirectories = new Set();

function searchDriveForFiles(drivePath, searchString) {
  const matchingFiles = [];

  try {
    const files = fs.readdirSync(drivePath);

    for (const file of files) {
      const filePath = path.join(drivePath, file);

      if (permissionErrorDirectories.has(filePath)) {
        continue;
      }

      try {
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          const results = searchDriveForFiles(filePath, searchString);
          if (results.length > 0) {
            matchingFiles.push(...results);
          }
        } else if (file.includes(searchString) && file.endsWith('.pdf')) {
          matchingFiles.push(filePath);
        }
      } catch (error) {
        if (error.code !== 'EACCES') {
          console.error('Error accessing file:', error);
        } else {
          permissionErrorDirectories.add(filePath);
        }
      }
    }

    return matchingFiles;
  } catch (error) {
    console.error('Error searching for files:', error);
    return matchingFiles;
  }
}


//function openPdfFile(filePath) {
//  const command = `start "" "${filePath}"`;
//  exec(command, (error, stdout, stderr) => {
//    if (error) {
//      console.error(`Error opening PDF file: ${error}`);
//    }
//  });
//}

//------------------------------GET-CUSTOMER-NAME-FROM-DIRECTO-------------------------------
function makeHttpRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

app.post('/fetchClientName', async (req, res) => {
  const orderNumber = req.body.orderNumber;
  const requestOptions = {
    protocol: 'https:',
    host: 'login.directo.ee',
    path: '/xmlcore/****/xmlcore_sc.asp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  const postData = `key=****&get=1&what=order&number=${orderNumber}`;

  try {
    const responseXml = await makeHttpRequest(requestOptions, postData);
    const parser = new xml2js.Parser();
    parser.parseString(responseXml, (err, result) => {
      if (err) {
        res.status(500).send({ error: 'Error parsing XML response' });
      } else {
        const clientName = result.transport.order[0].$.customername;
        res.status(200).send({ clientName });
      }
    });
  } catch (error) {
    res.status(500).send({ error: 'Error fetching client name from Directo' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
