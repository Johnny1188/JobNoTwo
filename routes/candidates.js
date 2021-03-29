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
        if(candidates_with_skills) {
            funcs.response_back(res,null,candidates_with_skills)
        } else {
            funcs.response_back(res,"No one found",null,404);
        }
    })
})

// GET single candidate
Router.get("/:id(\\d+)",(req,res) => {
    funcs.get_candidates_w_skills([{"id":req.params.id}],( candidate_with_skills ) => {
        if(candidate_with_skills) {
            funcs.response_back(res,null,candidate_with_skills)
        } else {
            funcs.response_back(res,`No candidate with ID ${req.params.id} found`,null,404)
        }
    })
})

// CREATE a candidate
Router.post("/", (req,res) => {
    if(req.body.firstname && req.body.lastname && req.body.expectedsalary) {
        // First create candidate in candidates table (firstname,lastname,expectedsalary)
        let query = "INSERT INTO candidates (firstname,lastname,expectedsalary) VALUES (?,?,?);";
        let parameters = [req.body.firstname,req.body.lastname,req.body.expectedsalary];

        mysql_connection.query(query,parameters, (err,result) => {
            if(err || result["insertId"] == undefined) { // Send error in creating candidate, don't continue
                funcs.response_back(res,err,null,500);
                return(false);
            };
            // With candidate's ID, create associative candidate-skill records in coresponding bridge table
            funcs.create_bridge_candidate_with_skills(result["insertId"],req.body.skills);
            funcs.response_back(res,err,`Successfully created candidate with ID: ${result["insertId"]}`);
        })
    } else {
        funcs.response_back(res,"Unsuccessful insert, request's body must have firstname, lastname and expectedsalary values.",null,406)
    }
})

// UPDATE a candidate
Router.put("/:id",(req,res) => {
    const candidate_id = req.params.id;
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
        parameters.push(candidate_id); // Add the ID of the candidate
        mysql_connection.query(query,parameters, (err,result) => {
            if(err) {
                funcs.response_back(res,err,result,500);
            };
        })
    }

    // Now update skills
    funcs.get_candidates_w_skills([{"id":candidate_id}],(candidate_with_skills) => {
        if(candidate_with_skills && candidate_with_skills.length > 0) {
            if(req.body.skills) {
                // Remove skills that are already in associative table, but current update doesn't include them
                let skills_to_remove = candidate_with_skills[0]["skills"].filter(skill => req.body.skills.includes(skill) == false);
                if(skills_to_remove && skills_to_remove.length > 0) {
                    funcs.remove_skills_from_candidate(candidate_id,skills_to_remove)
                };
                // Bridge with skills that candidate hasn't been associated yet
                let skills_to_add = req.body.skills.filter(skill => candidate_with_skills[0]["skills"].includes(skill) == false);
                if(skills_to_add && skills_to_add.length > 0) {
                    funcs.create_bridge_candidate_with_skills(candidate_id,skills_to_add);
                }
                funcs.response_back(res,null,`Successfully updated`);
            };
        } else {
            funcs.response_back(res,`No candidate with ID ${ candidate_id } found.`,null,404);
        }
    })
})

// DELETE a candidate
Router.delete("/:id",(req,res) => {
    mysql_connection.query(`DELETE FROM candidates WHERE id=?;`,[req.params.id], (err,result) => {
        if(err) {
            funcs.response_back(res,err,null,500);
        } else { // Rows in bridge table will automatically delete (foregin key->cascade)
            if(result.affectedRows >= 1) {
                funcs.response_back(res,err,`Successfully deleted candidate with ID: ${req.params.id}`);
            } else {
                funcs.response_back(res,"No candidate found with this ID",null,404);
            }
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
        if(err) {funcs.response_back(res,err,null,500)};
        if(result && result.length > 0) {
            funcs.response_back(res,err,result);
        } else {
            funcs.response_back(res,"No submitted applications",result,404);
        }
    })
});

// LIST ALL candidate's submitted applications (their titles)
Router.get("/:candidate_id/applications",(req,res) => {
    let query = `SELECT a.id,a.candidate_id,j.title FROM applications a
        INNER JOIN job_ads j ON j.id=a.job_id 
        WHERE candidate_id = ?;`;
    mysql_connection.query(query,[req.params.candidate_id], (err,result) => {
        if(err) {funcs.response_back(res,err,null,500)};
        if(result && result.length > 0) {
            funcs.response_back(res,err,result);
        } else {
            funcs.response_back(res,"No submitted applications for this candidate",result,404);
        }
    })
});

// SUBMIT candidate's application (job_id corresponds to ID of job's ad)
Router.post("/applications",(req,res) => {
    if(req.body.candidate_id && req.body.job_id) {
        let query = "INSERT INTO applications (candidate_id,job_id) VALUES (?,?);";
        let parameters = [req.body.candidate_id,req.body.job_id];
        mysql_connection.query(query,parameters, (err,result) => {
            if(err) {
                funcs.response_back(res,err,null,500);
            } else {
                funcs.response_back(res,err,`Successfully submitted application with ID: ${result["insertId"] ? result["insertId"] : "unknown" }`);
            }
        })
    } else {
        funcs.response_back(res,"Unsuccessful submission, request's body must have candidate_id and job_id values.",null,406);
    }
});

// DELETE candidate's submitted application
Router.delete("/:candidate_id/applications/:job_id",(req,res) => {
    let query = "DELETE FROM applications WHERE candidate_id = ? AND job_id = ?;";
    let params = [req.params.candidate_id,req.params.job_id];
    mysql_connection.query(query,params, (err,result) => {
        if(err) {
            funcs.response_back(res,err,null,500);
        } else {
            if(result.affectedRows >= 1) {
                funcs.response_back(res,err,`Successfully deleted application of candidate with ID: ${req.params.candidate_id} for the job ad with ID: ${req.params.job_id}`);
            } else {
                funcs.response_back(res,"No applications found with these IDs",null,404);
            }
        }
    })
});

module.exports = Router;