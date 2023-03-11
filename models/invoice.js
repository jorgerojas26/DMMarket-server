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
        "slavefact.Precio",
        "grupos.Descripcion as group"
      )
      .from("masterfact")
      .innerJoin("slavefact", "slavefact.IdFactura", "masterfact.IdFactura")
      .innerJoin("productos", "productos.IdProducto", "slavefact.IdProducto")
      .innerJoin("grupos", "grupos.IdGrupo", "productos.Grupo")
      .where("masterfact.Anulada", 0)
      .whereBetween("masterfact.Fecha", [from, to])
      .groupBy(
        "masterfact.IdFactura",
        "slavefact.IdProducto",
        "slavefact.Descripcion",
        "slavefact.Cantidad",
        "slavefact.Precio"
      )
      .orderBy("masterfact.IdFactura", "DESC")
      .orderBy("productos.Descripcion", "DESC");

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
        quantity: Number(invoice.Cantidad.toFixed(2)),
        price: Number(invoice.Precio.toFixed(2)),
        group: invoice.group,
      });
    });

    //calculate invoice totals
    Object.keys(invoices).forEach((invoiceId) => {
      const invoice = invoices[invoiceId];
      invoice.total = 0;
      invoice.products.forEach((product) => {
        invoice.total += product.quantity * product.price;
        invoice.total = Number(invoice.total.toFixed(2));
      });
    });

    let invoicesArray = Object.keys(invoices).map((key) => invoices[key]);

    return invoicesArray;
  } catch (error) {
    throw error;
  }
};

exports.GET_SALES_QUERY = async ({ from, to, groupId }) => {
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
      .modify((query) => {
        if (groupId) {
          query.innerJoin("grupos", "grupos.idGrupo", "productos.Grupo");
        }
      })
      .whereBetween("masterfact.Fecha", [from, to])
      .modify((query) => {
        if (groupId) {
          query.andWhere("grupos.idGrupo", groupId);
        }
      })
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

exports.GET_SALES_BY_CATEGORY = async ({ from, to, categoryId }) => {
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
      .andWhere("grupos.idGrupo", categoryId)
      .groupBy("grupos.idGrupo");

    return response;
  } catch (error) {
    throw error;
  }
};
