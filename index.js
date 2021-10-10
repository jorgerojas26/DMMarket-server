require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

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

app.use(express.static(path.join(__dirname, 'client/build')));

app.get('/*', function (request, response) {
  response.sendFile(path.resolve(__dirname, 'client/build', 'index.html'));
});

app.listen(8000, () => {
  console.log('server listening in port 8000');
});
