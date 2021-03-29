# JobNoTwo
### How to test JobNoTwo on your machine?

1. Clone the repository with ```git clone https://github.com/Johnny1188/JobNoTwo.git```
2. In the root folder called JobNoTwo, call ```npm install```
3. With MySQL Workbench or via command line, create database called **JobNoTwo**
    - In the root JobNoTwo folder, in the ```connection.js``` file, specify username and password for the database (default is root/root)
    - Load the MySQL dump into the created database with ```mysql -u [your-username] -p JobNoTwo < mysql_dump.sql```, and type your password when inquired.
4. In the root folder, call ```npm start``` and the REST API server should be up and running, listening on localhost's port 3000 

<sub><sup>PS: Made with npm version 7.7.5</sub></sup>

### API Endpoints

- ```/``` - Front primitive UI for sending POST/PUT/DELETE requests, otherwise use POSTMAN or any other means of interacting with following endpoints
- **GET** ```/candidates``` and ```/candidates/<candidate-id>``` - Retrieve all candidates' info and one specific candidate's info respectively
- **GET** ```/candidates/applications``` and ```/candidates/<candidate-id>/applications``` - Retrieve all job applications and applications from one specific candidate respectively
- **GET** ```/job_ads``` and ```/job_ads/<job_ad-id>``` - Retrieve all job ads' info and one specific job ad's info respectively
- **POST** ```/candidates``` - Create candidate (JSON body with values for keys ```firstname```,```lastname```,```expectedsalary```, and array of skills for key ```skills```)
- **POST** ```/candidates/applications``` - Submit job application (JSON body with values for keys ```candidate_id``` and ```job_id```)
- **POST** ```/job_ad``` - Create job ad (JSON body with values for keys ```title```,```salary``` and ```fullinfo```)
- **PUT** ```/candidates/<candidate-id>``` - Update candidate with specified ID (JSON body with values for keys ```firstname```,```lastname```,```expectedsalary```, and array of skills for key ```skills``` - all optional, include only what you want to change)
- **PUT** ```/job_ad/<job_ad-id>``` - Update job ad with specified ID (JSON body with values for keys ```title```,```salary``` and ```fullinfo``` - all optional, include what you want to change)
- **DELETE** ```/candidates/<candidate-id>``` - Delete candidate with specified ID
- **DELETE** ```/candidates/<candidate-id>/applications/<job_ad-id>``` - Delete application of candidate to the specified job ad
- **DELETE** ```/job_ad/<job_ad-id>``` - Delete job ad with specified ID