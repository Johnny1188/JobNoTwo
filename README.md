# JobNoTwo
### How to test JobNoTwo on your machine?

1. Clone the repository with ```git clone https://github.com/Johnny1188/JobNoTwo.git```
2. In the root folder called JobNoTwo, call ```npm install```
3. With MySQL Workbench or via command line, create database called **JobNoTwo**
    - In the root JobNoTwo folder, in the ```connection.js``` file, specify username and password for the database (default is root/root)
    - Load the MySQL dump into the created database with ```mysql -u [your-username] -p JobNoTwo < mysql_dump.sql```, and type your password when inquired.
4. In the root folder, call ```npm start``` and the REST API server should be up and running, listening on localhost's port 3000 

<sub><sup>PS: Made with npm version 7.7.5</sub></sup>
