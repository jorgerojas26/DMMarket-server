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
  const { from, to } = req.query;

  try {
    const response = await knex
      .select(
        "clientes.Empresa as client",
        knex.raw(
          "ROUND(SUM(slavefact.Precio * slavefact.Cantidad), 2) as total_USD"
        )
      )
      .from("slavefact")
      .innerJoin("masterfact", function () {
        this.on("masterfact.IdFactura", "slavefact.IdFactura").andOn(
          "masterfact.Anulada",
          0
        );
      })
      .innerJoin("clientes", "clientes.IdCliente", "masterfact.IdCliente")
      .whereBetween("masterfact.Fecha", [from, to])
      .groupBy("clientes.IdCliente")
      .orderBy("total_USD", "desc");

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
  }
};

const GET_BEST_CLIENTS_PER_PRODUCT = async (req, res) => {
  const { from, to } = req.query;
  const { productId } = req.params;

  try {
    const response = await knex
      .select(
        "clientes.Empresa as client",
        knex.raw("ROUND(SUM(slavefact.Cantidad), 2) as quantity_total"),
        knex.raw(
          "ROUND(SUM(slavefact.Precio * slavefact.Cantidad), 2) as total_USD"
        ),
        knex.raw(
          "ROUND(SUM((slavefact.Precio - slavefact.Costo) * slavefact.Cantidad), 2) as utilidad"
        )
      )
      .from("slavefact")
      .innerJoin("masterfact", function () {
        this.on("masterfact.IdFactura", "slavefact.IdFactura").andOn(
          "masterfact.Anulada",
          0
        );
      })
      .innerJoin("clientes", "clientes.IdCliente", "masterfact.IdCliente")
      .whereBetween("masterfact.Fecha", [from, to])
      .andWhere("slavefact.IdProducto", productId)
      .groupBy("clientes.IdCliente")
      .orderBy("total_USD", "desc");

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
  }
};

const MONTHLY_AVERAGE = async (req, res) => {
  const { clientId } = req.params;

  try {
    let response = await knex
      .select(
        knex.raw(`
          MIN(clientes.Empresa) as client,
       ROUND(SUM(IF(MONTH(masterfact.Fecha) = 1, slavefact.Precio * slavefact.Cantidad, NULL)), 2)  AS Enero,
       COUNT(IF(MONTH(masterfact.Fecha) = 1, slavefact.IdFactura, NULL))  AS Enero_transactions,
       ROUND(SUM(IF(MONTH(masterfact.Fecha) = 2, slavefact.Precio * slavefact.Cantidad, NULL)), 2)  AS Febrero,
       COUNT(IF(MONTH(masterfact.Fecha) = 2, slavefact.IdFactura, NULL))  AS Febrero_transactions,
       ROUND(SUM(IF(MONTH(masterfact.Fecha) = 3, slavefact.Precio * slavefact.Cantidad, NULL)), 2)  AS Marzo,
       COUNT(IF(MONTH(masterfact.Fecha) = 3, slavefact.IdFactura, NULL))  AS Marzo_transactions,
       ROUND(SUM(IF(MONTH(masterfact.Fecha) = 4, slavefact.Precio * slavefact.Cantidad, NULL)), 2)  AS Abril,
       COUNT(IF(MONTH(masterfact.Fecha) = 4, slavefact.IdFactura, NULL))  AS Abril_transactions,
       ROUND(SUM(IF(MONTH(masterfact.Fecha) = 5, slavefact.Precio * slavefact.Cantidad, NULL)), 2)  AS Mayo,
       COUNT(IF(MONTH(masterfact.Fecha) = 5, slavefact.IdFactura, NULL))  AS Mayo_transactions,
       ROUND(SUM(IF(MONTH(masterfact.Fecha) = 6, slavefact.Precio * slavefact.Cantidad, NULL)), 2)  AS Junio,
       COUNT(IF(MONTH(masterfact.Fecha) = 6, slavefact.IdFactura, NULL))  AS Junio_transactions,
       ROUND(SUM(IF(MONTH(masterfact.Fecha) = 7, slavefact.Precio * slavefact.Cantidad, NULL)), 2)  AS Julio,
       COUNT(IF(MONTH(masterfact.Fecha) = 7, slavefact.IdFactura, NULL))  AS Julio_transactions,
       ROUND(SUM(IF(MONTH(masterfact.Fecha) = 8, slavefact.Precio * slavefact.Cantidad, NULL)), 2)  AS Agosto,
       COUNT(IF(MONTH(masterfact.Fecha) = 8, slavefact.IdFactura, NULL))  AS Agosto_transactions,
       ROUND(SUM(IF(MONTH(masterfact.Fecha) = 9, slavefact.Precio * slavefact.Cantidad, NULL)), 2) AS Septiembre,
       COUNT(IF(MONTH(masterfact.Fecha) = 9, slavefact.IdFactura, NULL))  AS Septiembre_transactions,
       ROUND(SUM(IF(MONTH(masterfact.Fecha) = 10, slavefact.Precio * slavefact.Cantidad, NULL)), 2) AS Octubre,
       COUNT(IF(MONTH(masterfact.Fecha) = 10, slavefact.IdFactura, NULL))  AS Octubre_transactions,
       ROUND(SUM(IF(MONTH(masterfact.Fecha) = 11, slavefact.Precio * slavefact.Cantidad, NULL)), 2) AS Noviembre,
       COUNT(IF(MONTH(masterfact.Fecha) = 11, slavefact.IdFactura, NULL))  AS Noviembre_transactions,
       ROUND(SUM(IF(MONTH(masterfact.Fecha) = 12, slavefact.Precio * slavefact.Cantidad, NULL)), 2) AS Diciembre,
       COUNT(IF(MONTH(masterfact.Fecha) = 12, slavefact.IdFactura, NULL))  AS Diciembre_transactions
            `)
      )
      .from("slavefact")
      .innerJoin("masterfact", function () {
        this.on("masterfact.IdFactura", "slavefact.IdFactura").andOn(
          "masterfact.Anulada",
          0
        );
      })
      .innerJoin("clientes", "clientes.IdCliente", "masterfact.IdCliente")
      .where(
        knex.raw("YEAR(masterfact.Fecha)"),
        knex.raw("YEAR(CURDATE())")
      )
      .andWhere("masterfact.IdCliente", clientId)
      .groupBy("masterfact.IdCliente");

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
