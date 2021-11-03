const knex = require("knex");

const database = knex({
  client: "mysql2",
  connection: {
    host: "127.0.0.1",
    port: 3306,
    user: "melquisedec",
    password: "Jj20Rr399$1%",
    database: "bdsolser_md_nieto",
  },
});

module.exports = database;
