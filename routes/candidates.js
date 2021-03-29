const { response } = require("express");
const express = require("express");
const mysql_connection = require("../connection");
const funcs = require("./helper_functions");

const Router = express.Router();

// Utilities for parsing request's body
Router.use(express.json());
Router.use(express.urlencoded({ extended: true }));
//
//
// CRUD operations for candidates --->
//
//
// GET all candidates
Router.get("/", (req,res) => {
    funcs.get_candidates_w_skills(null,( candidates_with_skills ) => {
        funcs.response_back(res,null,candidates_with_skills)
    })
})

// GET single candidate
Router.get("/:id(\\d+)",(req,res) => {
    funcs.get_candidates_w_skills([{"id":req.params.id}],( candidate_with_skills ) => {
        funcs.response_back(res,null,candidate_with_skills);
    })
})

// CREATE a candidate
Router.post("/", (req,res) => {
    if(req.body.firstname && req.body.lastname && req.body.expectedsalary) {
        // First create candidate in candidates table (firstname,lastname,expectedsalary)
        let query = "INSERT INTO candidates (firstname,lastname,expectedsalary) VALUES (?,?,?);";
        let parameters = [req.body.firstname,req.body.lastname,req.body.expectedsalary];

        mysql_connection.query(query,parameters, (err,result) => {
            if(err || result["insertId"] == undefined) {funcs.response_back(res,err,result)}; // Send error in creating candidate back, don't continue
            // With candidate's ID, create associative candidate-skill records in coresponding bridge table
            funcs.create_bridge_candidate_with_skills(result["insertId"],req.body.skills);
            funcs.response_back(res,err,`Successfully created candidate with ID: ${result["insertId"]}`);
        })
    } else {
        funcs.response_back(res,null,"Unsuccessful insert, request's body must have firstname, lastname and expectedsalary values.");
    }
})

// UPDATE a candidate
Router.put("/:id",(req,res) => {
    let parameters = []

    // First update only firstname,lastname, expectedsalary (if the request's body contains them)
    let to_update_in_db = new Array("firstname","lastname","expectedsalary").reduce((all_updates,curr_key) => {
        if(req.body[curr_key]) {
            all_updates.push(`${curr_key} = ?`);
            parameters.push(req.body[curr_key]);
        }
        return( all_updates );
    },[])

    if(to_update_in_db.length > 0) {
        let query = "UPDATE candidates SET " + to_update_in_db + " WHERE id = ?;";
        parameters.push(req.params.id); // Add the ID of the candidate
        mysql_connection.query(query,parameters, (err,result) => {
            if(err) {funcs.response_back(res,err,result);};
        })
    }

    // Now update skills if request's body has them to update
    if(req.body.skills) {
        funcs.get_candidates_w_skills([{"id":req.params.id}],(candidate_with_skills) => {
            if(candidate_with_skills && candidate_with_skills.length > 0) {
                // Remove skills that are already in associative table, but current update doesn't include them
                let skills_to_remove = candidate_with_skills[0]["skills"].filter(skill => req.body.skills.includes(skill) == false);
                if(skills_to_remove && skills_to_remove.length > 0) {
                    funcs.remove_skills_from_candidate(req.params.id,skills_to_remove);
                };
                // Bridge with skills that candidate hasn't been associated yet
                let skills_to_add = req.body.skills.filter(skill => candidate_with_skills[0]["skills"].includes(skill) == false);
                if(skills_to_add && skills_to_add.length > 0) {
                    funcs.create_bridge_candidate_with_skills(req.params.id,skills_to_add);
                }
            } else {
                funcs.response_back(res,null,`No candidate with ID ${ req.params.id } found.`);
            }
        })
    }
    funcs.response_back(res,null,"Successfully updated");
})

// DELETE a candidate
Router.delete("/:id",(req,res) => {
    mysql_connection.query(`DELETE FROM candidates WHERE id=?;`,[req.params.id], (err,result) => {
        if(err) {
            funcs.response_back(res,err,null);
        } else {
            funcs.response_back(res,err,`Successfully deleted candidate with ID: ${req.params.id}`); // Rows in bridge table will automatically delete (foregin key->cascade)
        }
    })
})
//
//
// CRUD operations for candidates' job applications --->
//
//
// LIST ALL submited applications
Router.get("/applications",(req,res) => {

    // List candidate's ID, full name, job's ID and its title
    let query = `SELECT DISTINCT app_bridge.candidate_id,c.firstname,c.lastname,app_bridge.job_id,j.title FROM candidates c
        INNER JOIN applications app_bridge ON app_bridge.candidate_id = c.id
        INNER JOIN job_ads j ON j.id = app_bridge.job_id`;

    mysql_connection.query(query, (err,result) => {
        funcs.response_back(res,err,result);
    })
});

// LIST ALL candidate's submitted applications (their titles)
Router.get("/:candidate_id/applications",(req,res) => {
    let query = `SELECT a.id,a.candidate_id,j.title FROM applications a
        INNER JOIN job_ads j ON j.id=a.job_id 
        WHERE candidate_id = ?;`;
    mysql_connection.query(query,[req.params.candidate_id], (err,result) => {
        funcs.response_back(res,err,result);
    })
});

// SUBMIT candidate's application (job_id corresponds to ID of job's ad)
Router.post("/applications",(req,res) => {
    if(req.body.candidate_id && req.body.job_id) {

        let query = "INSERT INTO applications (candidate_id,job_id) VALUES (?,?);";
        let parameters = [req.body.candidate_id,req.body.job_id];
        mysql_connection.query(query,parameters, (err,result) => {
            funcs.response_back(res,err,`Successfully submitted application with ID: ${result["insertId"] ? result["insertId"] : "unknown" }`);
        })
    } else {
        funcs.response_back(res,null,"Unsuccessful submission, request's body should have candidate_id and job_id values.");
    }
});

// DELETE candidate's submitted application
Router.delete("/:candidate_id/applications/:job_id",(req,res) => {
    let query = "DELETE FROM applications WHERE candidate_id = ? AND job_id = ?;";
    let params = [req.params.candidate_id,req.params.job_id];
    mysql_connection.query(query,params, (err,result) => {
        if(err) {
            funcs.response_back(res,err,null);
        } else {
            funcs.response_back(res,err,`Successfully deleted application of candidate with ID: ${req.params.candidate_id} for the job ad with ID: ${req.params.job_id}`); // Rows in bridge table will automatically delete (foregin key->cascade)
        }
    })
});

module.exports = Router;