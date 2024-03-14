const knex = require("../database");
const model = require("../models/invoice");

const GET_INVOICES = async (req, res) => {
  const { from, to, showNoe } = req.query;

  try {
    const response = await model.GET_INVOICES({ from, to, showNoe });

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json(error);
    console.error(error);
  }
};

const GET_SALES = async (req, res) => {
  const { from, to, showNoe } = req.query;

  try {
    const sales_report = await model.GET_SALES_QUERY({ from, to });

    const group_sales_chart_data = await model.GET_BY_GROUP_QUERY({ from, to });

    const response = {
      sales_report,
      group_sales_chart_data,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
  }
};

const GET_SALES_BY_CATEGORY = async (req, res) => {
  const { from, to, showNotes } = req.query;
  const { categoryId, showNotesParams } = req.params;

  console.log(showNotes, showNotesParams);

  try {
    const sales_by_category_report = await model.GET_SALES_BY_CATEGORY({
      from,
      to,
      categoryId,
    });

    console.log("sales_by_category_report", sales_by_category_report);

    res.status(200).json(sales_by_category_report);
  } catch (error) {
    res.status(500).json(error);
    console.error(error);
  }
};

const GET_BY_GROUP = async (req, res) => {
  const { from, to, showNoe } = req.query;
  try {
    const masterTable = showNoe ? "masternoe" : "masterfact";
    const slaveTable = showNoe ? "slavenoe" : "slavefact";
    const idInvoice = showNoe ? "IdNoe " : "IdFactura";

    const response = await knex
      .select(
        "grupos.Descripcion as categoria",
        knex.raw(
          `ROUND(SUM(${slaveTable}.Precio * ${slaveTable}.Cantidad), 2) as rawProfit`
        ),
        knex.raw(
          `ROUND(SUM((${slaveTable}.Precio - ${slaveTable}.Costo) * ${slaveTable}.Cantidad), 2) as netProfit`
        )
      )
      .from(slaveTable)
      .innerJoin(masterTable, function () {
        this.on(`${masterTable}.${idInvoice}`, `${slaveTable}.${idInvoice}`).andOn(
          `${masterTable}.Anulada`,
          0
        );
      })
      .innerJoin(
        "productos",
        "productos.IdProducto",
        `${slaveTable}.IdProducto`
      )
      .innerJoin("grupos", "grupos.idGrupo", "productos.Grupo")
      .whereBetween(`${masterTable}.Fecha`, [from, to])
      .groupBy("grupos.idGrupo");

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  GET_INVOICES,
  GET_SALES,
  GET_BY_GROUP,
  GET_SALES_BY_CATEGORY,
};
