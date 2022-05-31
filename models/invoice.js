const knex = require("../database");

exports.GET_INVOICES = async ({ from, to }) => {
  try {
    const response = await knex
      .select(
        "masterfact.IdFactura as invoiceId",
        "masterfact.Nombre as client",
        "masterfact.Rif as rif",
        "masterfact.Fecha as createdAt",
        "slavefact.IdProducto",
        "slavefact.Descripcion",
        "slavefact.Cantidad",
        "slavefact.Precio"
      )
      .from("masterfact")
      .innerJoin("slavefact", "slavefact.IdFactura", "masterfact.IdFactura")
      .where("masterfact.Anulada", 0)
      .whereBetween("masterfact.Fecha", [from, to])
      .groupBy(
        "masterfact.IdFactura",
        "slavefact.IdProducto",
        "slavefact.Descripcion",
        "slavefact.Cantidad",
        "slavefact.Precio"
      )
      .orderBy("masterfact.IdFactura", "DESC");

    const invoices = {};

    response.forEach((invoice) => {
      if (!invoices[invoice.invoiceId]) {
        invoices[invoice.invoiceId] = {
          invoiceId: invoice.invoiceId,
          client: invoice.client,
          rif: invoice.rif,
          createdAt: invoice.createdAt,
          products: [],
        };
      }
      invoices[invoice.invoiceId].products.push({
        productId: invoice.IdProducto,
        product: invoice.Descripcion,
        quantity: invoice.Cantidad,
        price: invoice.Precio,
      });
    });

    //calculate invoice totals
    Object.keys(invoices).forEach((invoiceId) => {
      const invoice = invoices[invoiceId];
      invoice.total = 0;
      invoice.products.forEach((product) => {
        invoice.total += product.quantity * product.price;
      });
    });

    const invoicesArray = Object.keys(invoices).map((key) => invoices[key]);

    return invoicesArray;
  } catch (error) {
    throw error;
  }
};

exports.GET_SALES_QUERY = async ({ from, to }) => {
  try {
    const response = await knex
      .select(
        "productos.Descripcion as product",
        knex.raw("ROUND(SUM(slavefact.Cantidad), 3) as quantity"),
        knex.raw(
          "ROUND(SUM(slavefact.Precio * slavefact.Cantidad), 2) as rawProfit"
        ),
        knex.raw(
          "ROUND(SUM((slavefact.Precio - slavefact.Costo) * slavefact.Cantidad), 2) as netProfit"
        ),
        knex.raw(
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
    const response = await knex
      .select(
        "grupos.Descripcion as categoria",
        knex.raw(
          "ROUND(SUM(slavefact.Precio * slavefact.Cantidad), 2) as rawProfit"
        ),
        knex.raw(
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
