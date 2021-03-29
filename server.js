const express = require("express");
const path = require('path');
const routes_candidates = require("./routes/candidates");
const routes_job_ads = require("./routes/job_ads");

let app = express();
app.use(express.static(path.join(__dirname,"/static/css")));

// API routing
app.use("/candidates", routes_candidates);
app.use("/job_ads", routes_job_ads);

app.get("/",(req,res) => {
    res.sendFile(path.join(__dirname,'/static/html/testing.html'));
})

app.use((req, res, next) =>  {
    res.status(404).send({
        status: 404,
        message: "Sorry can't find that!"
    })
});

app.listen(3000,() => {console.log("Job#2's server listening on port 3000")});