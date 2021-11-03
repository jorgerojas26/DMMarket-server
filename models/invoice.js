const database = require("../database");

exports.GET_SALES_QUERY = async ({ from, to }) => {
  try {
    const response = await database
      .select(
        "productos.Descripcion as product",
        database.raw("ROUND(SUM(slavefact.Cantidad), 3) as quantity"),
        database.raw(
          "ROUND(SUM(slavefact.Precio * slavefact.Cantidad), 2) as rawProfit"
        ),
        database.raw(
          "ROUND(SUM((slavefact.Precio - slavefact.Costo) * slavefact.Cantidad), 2) as netProfit"
        ),
        database.raw(
          "ROUND(AVG((slavefact.Precio - slavefact.Costo) / slavefact.Precio * 100), 2) as averageProfitPercent"
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
      .whereBetween("masterfact.Fecha", [from, to])
      .groupBy("productos.IdProducto")
      .orderBy("rawProfit", "DESC");

    return response;
  } catch (error) {
    return error;
  }
};

exports.GET_BY_GROUP_QUERY = async ({ from, to }) => {
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

    return response;
  } catch (error) {
    return error;
  }
};
