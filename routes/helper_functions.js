const mysql_connection = require("../connection");

const response_back = (response, err, result) => {
    let to_send_back = err ? `Error occurred: ${err}` : result;
    if(!response.headersSent) {
        response.json(to_send_back);
    }
};

const merge_candidates_w_skills = (candidates) => {
    if(candidates && candidates.length > 0) {
        // Group candidates based on their ids
        let candidates_grouped = {};
        candidates.forEach(c => {
            if(!candidates_grouped[c.id]) {
                candidates_grouped[c.id] = {id:c.id,firstname: c.firstname, lastname: c.lastname, expectedsalary: c.expectedsalary, skills: [c.title]};
            } else {
                candidates_grouped[c.id].skills.push(c.title);
            }
        })
        return( Object.values(candidates_grouped) );
    } else {
        return( null )
    }
}

const get_candidates_w_skills = (candidates,callback) => {
    // Get candidates' associated skills from the bridge table
    let query = `SELECT DISTINCT c.*,s.title FROM skills s
        INNER JOIN candidate_skill_bridge bridge ON bridge.skill_id = s.id
        RIGHT JOIN candidates c ON c.id = bridge.candidate_id
        ${ candidates ? ("WHERE c.id IN (" + candidates.map(candidate_obj => candidate_obj.id).join(",") + ")") : "" };`;
    mysql_connection.query(query,(err,ungrouped_candidates_w_skills) => {
        if(err) {console.log(`Error in searching for candidates and their skills in DB: ${err}`)};
        let candidates_with_skills = merge_candidates_w_skills(ungrouped_candidates_w_skills);
        callback( candidates_with_skills );
    })
}

const get_skill_ids = (skills,callback) => {
    query = `SELECT id FROM skills WHERE title in (${new Array(skills.length).fill('?').join(",")});`;
    mysql_connection.query(query,skills,(err,result) => {
        if(err) {console.log(`Error in searching for skill IDs in DB: ${err}`)};
        callback(result);
    });
}

const create_bridge_candidate_with_skills = (candidate_id,skills) => {
    //  1. Create skill in DB if it doesn't exist
    let query = "INSERT INTO skills (title) ";
    let parameters = [];
    if(skills && skills.length > 0) {
        //  1.1 Construct query to insert skills if they don't yet exist in skills table
        const num_of_skills = skills.length;
        for(var nth_skill = 0; nth_skill < num_of_skills; nth_skill++) {
            query += "SELECT ? WHERE NOT EXISTS (SELECT 1 FROM skills WHERE title = ?) ";
            parameters.push.apply(parameters, [skills[nth_skill],skills[nth_skill]]); // Add two params for the mysql query
            query += nth_skill < num_of_skills-1 ? "UNION ALL " : ";"; // + UNION ALL if not the end of skills to add
        }
        mysql_connection.query(query,parameters,err => {
            if(err) {console.log(`Error in inserting skills into DB: ${err}`)};
            //  2. Insert a bridge row in candidate-skill table (candidate_id,skill_id)
            //  2.1 Get all skill ids
            get_skill_ids(skills,(skills_found) => {
                //  2.2 Insert all candidate_id-skill_id into associative table
                query = "INSERT INTO candidate_skill_bridge (candidate_id,skill_id) VALUES " + skills_found.map(skill_obj => `(${candidate_id},${skill_obj.id})`) + ";";
                mysql_connection.query(query, err => {
                    if(err) {console.log(`Error in inserting candidate_id-skill_id into associative table: ${err}`)};
                })
            })
        })
    }
}

const remove_skills_from_candidate = (candidate_id,skills_to_remove) => {
    get_skill_ids(skills_to_remove,(skills_found) => {
        if(skills_found.length > 0) {
            let query = `DELETE FROM candidate_skill_bridge WHERE candidate_id = ? AND 
                skill_id IN (${ skills_found.map(skill_obj => skill_obj.id).join(",") })`;
            mysql_connection.query(query,[candidate_id],(err,result) => {
                if(err) {
                    console.log(`Error in deleting candidate_id-skill_id from associative table: ${err}`)
                } else {
                    console.log("Successfully removed skills");
                };
            })
        }
    })
}

module.exports = {response_back,merge_candidates_w_skills,get_candidates_w_skills,get_skill_ids,create_bridge_candidate_with_skills,remove_skills_from_candidate}