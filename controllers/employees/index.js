const knex = require("../../database");
const fs = require("fs");

const GET_EMPLOYEES = async (req, res) => {
  try {
    const response = await knex
      .select(
        "idVend as id",
        "Empresa as name",
        "Rif as rif",
        "Ci as ci",
        "Telfs as phone"
      )
      .from("vendedores");
    res.status(200).json(response);
  } catch (error) {
    console.log(error);
  }
};

const GET_COMMISSION_INFO = async (req, res) => {
  const { employeeId } = req.params;

  try {
    const response = await knex
      .select(
        "grupos.IdGrupo as groupId",
        "grupos.Descripcion as group",
        "vendedor_comisiones.comision as commission"
      )
      .from("vendedor_comisiones")
      .rightJoin("grupos", "grupos.IdGrupo", "vendedor_comisiones.grupoId");
    res.status(200).json(response);
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE") {
      const migration = fs
        .readFileSync(
          "./controllers/employees/create-table-vendedor-comisiones.sql",
          "utf8"
        )
        .toString();
      await knex.raw(migration);
      GET_COMMISSION_INFO(req, res);
    }
    console.log(error.code);
  }
};

const UPDATE_COMMISSION_INFO = async (req, res) => {
  const { employeeId } = req.params;
  const { commissionInfo } = req.body;
  console.log(employeeId, commissionInfo);

  if (!commissionInfo || Object.keys(commissionInfo).length === 0) {
    res
      .status(400)
      .json({ error: { message: "Debe enviar la información comisiones" } });
    return;
  }

  try {
    for (const [key, value] of Object.entries(commissionInfo)) {
      const commission = await knex("vendedor_comisiones").where(
        "grupoId",
        key
      );
      console.log("checking if commissionInfo exists in database", commission);
      if (commission.length) {
        const response = await knex("vendedor_comisiones")
          .update("comision", value)
          .where("grupoId", key);
      } else {
        const response = await knex("vendedor_comisiones").insert({
          vendedorId: employeeId,
          grupoId: key,
          comision: value,
        });
      }
    }
    res.status(201).json({ success: true });
  } catch (error) {
    console.log(error);
  }
};

const GET_SALES = async (req, res) => {
  const { from, to } = req.query;
  const { employeeId } = req.params;

  try {
    const response = await knex
      .select(
        "masterfact.IdFactura as invoiceId",
        "masterfact.Nombre as client",
        "masterfact.Rif as rif",
        "masterfact.Fecha as createdAt",
        knex.raw(
          "ROUND(SUM(slavefact.Precio * slavefact.Cantidad), 2) as invoiceTotal"
        ),
        knex.raw(
          `ROUND(SUM(CASE WHEN ISNULL(fact_vendedor_comisiones.comision) 
                THEN 0 
                ELSE slavefact.Precio * slavefact.Cantidad * (fact_vendedor_comisiones.comision / 100)
                END
              ), 2) as commissionTotal`
        )
      )
      .from("masterfact")
      .innerJoin("slavefact", "slavefact.IdFactura", "masterfact.IdFactura")
      .innerJoin("productos", "productos.IdProducto", "slavefact.IdProducto")
      .leftJoin("fact_vendedor_comisiones", function () {
        this.on("fact_vendedor_comisiones.grupoId", "productos.Grupo").andOn(
          "fact_vendedor_comisiones.masterfactId",
          "masterfact.IdFactura"
        );
      })
      .whereBetween("masterfact.Fecha", [from, to])
      .andWhere("masterfact.IdVend", employeeId)
      .andWhere("masterfact.Anulada", 0)
      .groupBy("masterfact.IdFactura")
    .orderBy('masterfact.Fecha', 'DESC')
    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false });
  }
};

module.exports = {
  GET_EMPLOYEES,
  GET_COMMISSION_INFO,
  UPDATE_COMMISSION_INFO,
  GET_SALES,
};
