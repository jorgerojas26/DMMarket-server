const database = require("../database");
const model = require("../models/invoice");

const GET_SALES = async (req, res) => {
  const { from, to } = req.query;

  try {
    const sales_report = await model.GET_SALES_QUERY({ from, to });
    const group_sales_chart_data = await model.GET_BY_GROUP_QUERY({ from, to });
    console.log(sales_report);
    console.log(group_sales_chart_data);
    const response = {
      sales_report,
      group_sales_chart_data,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
  }
};

const GET_BY_GROUP = async (req, res) => {
  const { from, to } = req.query;
  try {
    const response = await database
      .select(
        "grupos.Descripcion as categoria",
        database.raw(
          "ROUND(SUM(slavefact.Precio * slavefact.Cantidad), 2) as rawProfit"
        ),
        database.raw(
          "ROUND(SUM((slavefact.Precio - slavefact.Costo) * slavefact.Cantidad), 2) as netProfit"
        )
      )
      .from("slavefact")
      .innerJoin("masterfact", function () {
        this.on("masterfact.IdFactura", "slavefact.IdFactura").andOn(
          "masterfact.Anulada",
          0
        );
      })
      .innerJoin("productos", "productos.IdProducto", "slavefact.IdProducto")
      .innerJoin("grupos", "grupos.idGrupo", "productos.Grupo")
      .whereBetween("masterfact.Fecha", [from, to])
      .groupBy("grupos.idGrupo");

    res.status(200).json(response);
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  GET_SALES,
  GET_BY_GROUP,
};
