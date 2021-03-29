const express = require("express");
const mysql_connection = require("../connection");
const funcs = require("./helper_functions");

const Router = express.Router();

// Utilities for parsing request's body
Router.use(express.json());
Router.use(express.urlencoded({ extended: true }));

// GET all job ads
Router.get("/",(req,res) => {
    mysql_connection.query("SELECT * FROM job_ads;",(err,result) => {
        funcs.response_back(res,err,result);
    })
});

// GET single job ad
Router.get("/:id",(req,res) => {
    mysql_connection.query("SELECT * FROM job_ads WHERE id=?;",[req.params.id],(err,result) => {
        funcs.response_back(res,err,result);
    })
})

// CREATE a job ad
Router.post("/", (req,res) => {
    if(req.body.title && req.body.salary && req.body.fullinfo) {
        let query = "INSERT INTO job_ads (title,salary,fullinfo) VALUES (?,?,?);";
        let parameters = [req.body.title, req.body.salary, req.body.fullinfo];
        mysql_connection.query(query,parameters, (err,result) => {
            funcs.response_back(res,err,`Successfully created job ad with ID: ${result["insertId"] ? result["insertId"] : "unknown" }`);
        })
    } else {
        funcs.response_back(res,null,"Request's JSON body needs to have title,salary and fullinfo values.");
    }
})

// UPDATE a job ad
Router.put("/:id",(req,res) => {
    let parameters = []

    let to_update_in_db = new Array("title","salary","fullinfo").reduce((all_updates,curr_key) => {
        if(req.body[curr_key]) {
            all_updates.push(`${curr_key} = ?`);
            parameters.push(req.body[curr_key]);
        }
        return( all_updates );
    },[])
    
    if(to_update_in_db.length > 0) {
        let query = "UPDATE job_ads SET " + to_update_in_db + " WHERE id = ?;";
        parameters.push(req.params.id); // Add the ID of the job ad
        mysql_connection.query(query,parameters, (err,result) => {
            funcs.response_back(res,err,`Successfully updated job ad with ID: ${req.params.id}`);
        })
    } else {
        funcs.response_back(res,null,"Nothing updated, request's body needs to have title,salary or/and fullinfo values.");
    }
})

// DELETE a job ad
Router.delete("/:id",(req,res) => {
    mysql_connection.query(`DELETE FROM job_ads WHERE id=?;`,[req.params.id], (err,result) => {
        if(err) {
            funcs.response_back(res,err,null);
        } else {
            funcs.response_back(res,err,`Successfully deleted job ad with ID: ${req.params.id}`);
        }
    })
})

module.exports = Router;