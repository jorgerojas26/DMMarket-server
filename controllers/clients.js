const knex = require("../database");
const MONTHS = require("../utils/months");

const GET_CLIENTS = async (req, res) => {
  const { filter } = req.query;

  try {
    if (filter) {
      try {
        const response = await knex
          .select("IdCliente", "Empresa as name")
          .from("clientes")
          .where(knex.raw(`Empresa LIKE '%${filter}%'`));
        res.status(200).json(response);
      } catch (error) {
        console.log(error);
      }
    } else {
      try {
        const response = await knex
          .select("IdCliente", "Empresa as name")
          .from("clientes");
        res.status(200).json(response);
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.error(error);
  }
};

const GET_BEST_CLIENTS = async (req, res) => {
  const { from, to, showNoe } = req.query;

  const masterTable = showNoe ? "masternoe" : "masterfact";
  const slaveTable = showNoe ? "slavenoe" : "slavefact";
  const idInvoice = showNoe ? "IdNoe " : "IdFactura";

  try {
    const response = await knex
      .select(
        "clientes.Empresa as client",
        knex.raw(
          `ROUND(SUM(${slaveTable}.Precio * ${slaveTable}.Cantidad), 2) as total_USD`
        )
      )
      .from(`${slaveTable}`)
      .innerJoin(`${masterTable}`, function () {
        this.on(`${masterTable}.${idInvoice}`, `${slaveTable}.${idInvoice}`).andOn(
          `${masterTable}.Anulada`,
          0
        );
      })
      .innerJoin("clientes", "clientes.IdCliente", `${masterTable}.IdCliente`)
      .whereBetween(`${masterTable}.Fecha`, [from, to])
      .groupBy("clientes.IdCliente")
      .orderBy("total_USD", "desc");

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
  }
};

const GET_BEST_CLIENTS_PER_PRODUCT = async (req, res) => {
  const { productId } = req.params;
  const { from, to, showNoe } = req.query;

  const masterTable = showNoe ? "masternoe" : "masterfact";
  const slaveTable = showNoe ? "slavenoe" : "slavefact";
  const idInvoice = showNoe ? "IdNoe " : "IdFactura";

  try {
    const response = await knex
      .select(
        "clientes.Empresa as client",
        knex.raw(`ROUND(SUM(${slaveTable}.Cantidad), 2) as quantity_total`),
        knex.raw(
          `ROUND(SUM(${slaveTable}.Precio * ${slaveTable}.Cantidad), 2) as total_USD`
        ),
        knex.raw(
          `ROUND(SUM((${slaveTable}.Precio - ${slaveTable}.Costo) * ${slaveTable}.Cantidad), 2) as utilidad`
        )
      )
      .from(`${slaveTable}`)
      .innerJoin(`${masterTable}`, function () {
        this.on(`${masterTable}.${idInvoice}`, `${slaveTable}.${idInvoice}`).andOn(
          `${masterTable}.Anulada`,
          0
        );
      })
      .innerJoin("clientes", "clientes.IdCliente", `${masterTable}.IdCliente`)
      .whereBetween(`${masterTable}.Fecha`, [from, to])
      .andWhere(`${slaveTable}.IdProducto`, productId)
      .groupBy("clientes.IdCliente")
      .orderBy("total_USD", "desc");

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
  }
};

const MONTHLY_AVERAGE = async (req, res) => {
  const { clientId } = req.params;
  const { showNoe } = req.query;

  try {
    const masterTable = showNoe ? "masternoe" : "masterfact";
    const slaveTable = showNoe ? "slavenoe" : "slavefact";
    const idInvoice = showNoe ? "IdNoe " : "IdFactura";

    let response = await knex
      .select(
        knex.raw(`
          MIN(clientes.Empresa) as client,
       ROUND(SUM(IF(MONTH(${masterTable}.Fecha) = 1, ${slaveTable}.Precio * ${slaveTable}.Cantidad, NULL)), 2)  AS Enero,
       COUNT(IF(MONTH(${masterTable}.Fecha) = 1, ${slaveTable}.${idInvoice}, NULL))  AS Enero_transactions,
       ROUND(SUM(IF(MONTH(${masterTable}.Fecha) = 2, ${slaveTable}.Precio * ${slaveTable}.Cantidad, NULL)), 2)  AS Febrero,
       COUNT(IF(MONTH(${masterTable}.Fecha) = 2, ${slaveTable}.${idInvoice}, NULL))  AS Febrero_transactions,
       ROUND(SUM(IF(MONTH(${masterTable}.Fecha) = 3, ${slaveTable}.Precio * ${slaveTable}.Cantidad, NULL)), 2)  AS Marzo,
       COUNT(IF(MONTH(${masterTable}.Fecha) = 3, ${slaveTable}.${idInvoice}, NULL))  AS Marzo_transactions,
       ROUND(SUM(IF(MONTH(${masterTable}.Fecha) = 4, ${slaveTable}.Precio * ${slaveTable}.Cantidad, NULL)), 2)  AS Abril,
       COUNT(IF(MONTH(${masterTable}.Fecha) = 4, ${slaveTable}.${idInvoice}, NULL))  AS Abril_transactions,
       ROUND(SUM(IF(MONTH(${masterTable}.Fecha) = 5, ${slaveTable}.Precio * ${slaveTable}.Cantidad, NULL)), 2)  AS Mayo,
       COUNT(IF(MONTH(${masterTable}.Fecha) = 5, ${slaveTable}.${idInvoice}, NULL))  AS Mayo_transactions,
       ROUND(SUM(IF(MONTH(${masterTable}.Fecha) = 6, ${slaveTable}.Precio * ${slaveTable}.Cantidad, NULL)), 2)  AS Junio,
       COUNT(IF(MONTH(${masterTable}.Fecha) = 6, ${slaveTable}.${idInvoice}, NULL))  AS Junio_transactions,
       ROUND(SUM(IF(MONTH(${masterTable}.Fecha) = 7, ${slaveTable}.Precio * ${slaveTable}.Cantidad, NULL)), 2)  AS Julio,
       COUNT(IF(MONTH(${masterTable}.Fecha) = 7, ${slaveTable}.${idInvoice}, NULL))  AS Julio_transactions,
       ROUND(SUM(IF(MONTH(${masterTable}.Fecha) = 8, ${slaveTable}.Precio * ${slaveTable}.Cantidad, NULL)), 2)  AS Agosto,
       COUNT(IF(MONTH(${masterTable}.Fecha) = 8, ${slaveTable}.${idInvoice}, NULL))  AS Agosto_transactions,
       ROUND(SUM(IF(MONTH(${masterTable}.Fecha) = 9, ${slaveTable}.Precio * ${slaveTable}.Cantidad, NULL)), 2) AS Septiembre,
       COUNT(IF(MONTH(${masterTable}.Fecha) = 9, ${slaveTable}.${idInvoice}, NULL))  AS Septiembre_transactions,
       ROUND(SUM(IF(MONTH(${masterTable}.Fecha) = 10, ${slaveTable}.Precio * ${slaveTable}.Cantidad, NULL)), 2) AS Octubre,
       COUNT(IF(MONTH(${masterTable}.Fecha) = 10, ${slaveTable}.${idInvoice}, NULL))  AS Octubre_transactions,
       ROUND(SUM(IF(MONTH(${masterTable}.Fecha) = 11, ${slaveTable}.Precio * ${slaveTable}.Cantidad, NULL)), 2) AS Noviembre,
       COUNT(IF(MONTH(${masterTable}.Fecha) = 11, ${slaveTable}.${idInvoice}, NULL))  AS Noviembre_transactions,
       ROUND(SUM(IF(MONTH(${masterTable}.Fecha) = 12, ${slaveTable}.Precio * ${slaveTable}.Cantidad, NULL)), 2) AS Diciembre,
       COUNT(IF(MONTH(${masterTable}.Fecha) = 12, ${slaveTable}.${idInvoice}, NULL))  AS Diciembre_transactions
            `)
      )
      .from(`${slaveTable}`)
      .innerJoin(`${masterTable}`, function () {
        this.on(`${masterTable}.${idInvoice}`, `${slaveTable}.${idInvoice}`).andOn(
          `${masterTable}.Anulada`,
          0
        );
      })
      .innerJoin("clientes", "clientes.IdCliente", `${masterTable}.IdCliente`)
      .where(
        knex.raw(`YEAR(${masterTable}.Fecha)`),
        knex.raw("YEAR(CURDATE())")
      )
      .andWhere(`${masterTable}.IdCliente`, clientId)
      .groupBy(`${masterTable}.IdCliente`);

    response = response.reduce(
      (acc, current) => ({
        id: current.client,
        data: Object.keys(MONTHS).map(
          (month) => ({ x: MONTHS[month], y: current[month] }),
          []
        ),
      }),
      {}
    );
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  GET_CLIENTS,
  GET_BEST_CLIENTS,
  GET_BEST_CLIENTS_PER_PRODUCT,
  MONTHLY_AVERAGE,
};
