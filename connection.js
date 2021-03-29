const mysql = require("mysql");

let mysql_connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "JobNoTwo",
    multipleStatements: true
});

mysql_connection.connect((err) => {
    if(!err) {
        console.log("MySQL connection established");
    } else {
        console.log(`Connection to MySQL failed ${err}`);
    }
});

module.exports = mysql_connection;