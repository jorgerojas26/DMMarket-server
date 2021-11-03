const database = require("../database");

const GET_GROUPS = async (req, res) => {
  try {
    const response = await database
      .select("IdGrupo as groupId", "Descripcion as name")
      .from("grupos");
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  GET_GROUPS,
};
