require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

const MONTHS = {
  Enero: 'Enero',
  Febrero: 'Febrero',
  Marzo: 'Marzo',
  Abril: 'Abril',
  Mayo: 'Mayo',
  Junio: 'Junio',
  Agosto: 'Agosto',
  Septiembre: 'Septiembre',
  Octubre: 'Octubre',
  Noviembre: 'Noviembre',
  Diciembre: 'Diciembre',
};

const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  },
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/reports/invoice', async (req, res) => {
  const { from, to } = req.query;

  const sale_report = await knex
    .select(
      'productos.Descripcion as product',
      knex.raw('ROUND(SUM(slavefact.Cantidad), 3) as quantity'),
      knex.raw('ROUND(SUM(slavefact.Precio * slavefact.Cantidad), 2) as rawProfit'),
      knex.raw('ROUND(SUM((slavefact.Precio - slavefact.Costo) * slavefact.Cantidad), 2) as netProfit')
    )
    .from('slavefact')
    .innerJoin('masterfact', function () {
      this.on('masterfact.idFactura', 'slavefact.idFactura').andOn('masterfact.Anulada', 0);
    })
    .innerJoin('productos', 'productos.idProducto', 'slavefact.idProducto')
    .whereBetween('masterfact.Fecha', [from, to])
    .groupBy('productos.idProducto');

  const categories_report = await knex
    .select(
      'grupos.Descripcion as categoria',
      knex.raw('ROUND(SUM(slavefact.Precio * slavefact.Cantidad), 2) as rawProfit'),
      knex.raw('ROUND(SUM((slavefact.Precio - slavefact.Costo) * slavefact.Cantidad), 2) as netProfit')
    )
    .from('slavefact')
    .innerJoin('masterfact', function () {
      this.on('masterfact.idFactura', 'slavefact.idFactura').andOn('masterfact.Anulada', 0);
    })
    .innerJoin('productos', 'productos.idProducto', 'slavefact.idProducto')
    .innerJoin('grupos', 'grupos.idGrupo', 'productos.Grupo')
    .whereBetween('masterfact.Fecha', [from, to])
    .groupBy('grupos.idGrupo');

  const client_report = await knex
    .select('clientes.Empresa as client', knex.raw('ROUND(SUM(slavefact.Precio * slavefact.Cantidad), 2) as total_USD'))
    .from('slavefact')
    .innerJoin('masterfact', function () {
      this.on('masterfact.idFactura', 'slavefact.idFactura').andOn('masterfact.Anulada', 0);
    })
    .innerJoin('clientes', 'clientes.idCliente', 'masterfact.idCliente')
    .whereBetween('masterfact.Fecha', [from, to])
    .groupBy('clientes.idCliente')
    .orderBy('total_USD', 'desc');

  const response = {
    sale_report,
    categories_report,
    client_report,
  };

  res.status(200).json(response);
});

app.use('/api/reports/products/buy-price-fluctuation/:productId', async (req, res) => {
  const { productId } = req.params;

  let response = await knex
    .select(
      knex.raw(`
          slavecomp.Descripcion,
       ROUND(AVG(IF(MONTH(mastercomp.Fecha) = 1, slavecomp.Precio, NULL)), 2)  AS Enero,
       COUNT(IF(MONTH(mastercomp.Fecha) = 1, slavecomp.idFactura, NULL))  AS Enero_transactions,
       ROUND(AVG(IF(MONTH(mastercomp.Fecha) = 2, slavecomp.Precio, NULL)), 2)  AS Febrero,
       COUNT(IF(MONTH(mastercomp.Fecha) = 2, slavecomp.idFactura, NULL))  AS Febrero_transactions,
       ROUND(AVG(IF(MONTH(mastercomp.Fecha) = 3, slavecomp.Precio, NULL)), 2)  AS Marzo,
       COUNT(IF(MONTH(mastercomp.Fecha) = 3, slavecomp.idFactura, NULL))  AS Marzo_transactions,
       ROUND(AVG(IF(MONTH(mastercomp.Fecha) = 4, slavecomp.Precio, NULL)), 2)  AS Abril,
       COUNT(IF(MONTH(mastercomp.Fecha) = 4, slavecomp.idFactura, NULL))  AS Abril_transactions,
       ROUND(AVG(IF(MONTH(mastercomp.Fecha) = 5, slavecomp.Precio, NULL)), 2)  AS Mayo,
       COUNT(IF(MONTH(mastercomp.Fecha) = 5, slavecomp.idFactura, NULL))  AS Mayo_transactions,
       ROUND(AVG(IF(MONTH(mastercomp.Fecha) = 6, slavecomp.Precio, NULL)), 2)  AS Junio,
       COUNT(IF(MONTH(mastercomp.Fecha) = 6, slavecomp.idFactura, NULL))  AS Junio_transactions,
       ROUND(AVG(IF(MONTH(mastercomp.Fecha) = 7, slavecomp.Precio, NULL)), 2)  AS Julio,
       COUNT(IF(MONTH(mastercomp.Fecha) = 7, slavecomp.idFactura, NULL))  AS Julio_transactions,
       ROUND(AVG(IF(MONTH(mastercomp.Fecha) = 8, slavecomp.Precio, NULL)), 2)  AS Agosto,
       COUNT(IF(MONTH(mastercomp.Fecha) = 8, slavecomp.idFactura, NULL))  AS Agosto_transactions,
       ROUND(AVG(IF(MONTH(mastercomp.Fecha) = 9, slavecomp.Precio, NULL)), 2) AS Septiembre,
       COUNT(IF(MONTH(mastercomp.Fecha) = 9, slavecomp.idFactura, NULL))  AS Septiembre_transactions,
       ROUND(AVG(IF(MONTH(mastercomp.Fecha) = 10, slavecomp.Precio, NULL)), 2) AS Octubre,
       COUNT(IF(MONTH(mastercomp.Fecha) = 10, slavecomp.idFactura, NULL))  AS Octubre_transactions,
       ROUND(AVG(IF(MONTH(mastercomp.Fecha) = 11, slavecomp.Precio, NULL)), 2) AS Noviembre,
       COUNT(IF(MONTH(mastercomp.Fecha) = 11, slavecomp.idFactura, NULL))  AS Noviembre_transactions,
       ROUND(AVG(IF(MONTH(mastercomp.Fecha) = 12, slavecomp.Precio, NULL)), 2) AS Diciembre,
       COUNT(IF(MONTH(mastercomp.Fecha) = 12, slavecomp.idFactura, NULL))  AS Diciembre_transactions
            `)
    )
    .from('slavecomp')
    .innerJoin('mastercomp', function () {
      this.on('mastercomp.idFactura', 'slavecomp.idFactura').andOn('mastercomp.Anulada', 0);
    })
    .where(knex.raw('YEAR(mastercomp.Fecha)'), knex.raw('YEAR(CURDATE())'))
    .andWhere('slavecomp.idProducto', productId.toString());

  response = response.reduce(
    (acc, current) => ({
      id: current.Descripcion,
      data: Object.keys(MONTHS).map((month) => ({ x: month, y: current[month] }), []),
    }),
    {}
  );
  res.status(200).json(response);
});

app.use('/api/products', async (req, res) => {
  const { filter } = req.query;
  if (filter) {
    try {
      const response = await knex
        .select('idProducto', 'Descripcion')
        .from('productos')
        .where(knex.raw(`Descripcion LIKE '%${filter}%'`));
      res.status(200).json(response);
    } catch (error) {
      console.log(error);
    }
  } else {
    try {
      const response = await knex.select('idProducto', 'Descripcion').from('productos');
      res.status(200).json(response);
    } catch (error) {
      console.log(error);
    }
  }
});

app.use(express.static(path.join(__dirname, 'client/build')));

app.get('/*', function (request, response) {
  response.sendFile(path.resolve(__dirname, 'client/build', 'index.html'));
});

app.listen(8000, () => {
  console.log('server listening in port 8000');
});
