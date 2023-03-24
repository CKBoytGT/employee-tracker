const mysql = require('mysql2');
const inquirer = require('inquirer');
const consoleTable = require('console.table');

//==================== CONNECTION ====================//

// connect to mysql db
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'pretty-formless-toward-bright-eyes',
    database: 'employee_db'
});

// show error if connection fails
connection.connect(function(err) {
    if (err) throw err;
    start();
});

//==================== START ====================//

function start() {
    // banner text generated at https://www.kammerl.de/ascii/AsciiSignature.php
    console.log(`\u001b[36m _____           _                    _____             _           
|   __|_____ ___| |___ _ _ ___ ___   |_   _|___ ___ ___| |_ ___ ___ 
|   __|     | . | | . | | | -_| -_|    | | |  _| .'|  _| '_| -_|  _|
|_____|_|_|_|  _|_|___|_  |___|___|    |_| |_| |__,|___|_,_|___|_|  
            |_|       |___|                                         
\u001b[0m--------------------------------------------------------------------
`);
    mainMenu();
};

//==================== MAIN MENU ====================//

// main menu questions
function mainMenu() {
    inquirer.prompt({
        type: 'list',
        message: 'What would you like to do?',
        name: 'choice',
        choices:
            [
                'View all employees',
                'Add employee',
                'Update employee role',
                'View all roles',
                'Add role',
                'View all departments',
                'Add department',
                'QUIT'
            ]
    }).then((data) => {
        switch (data.choice) {
            case 'View all employees':
                viewAllEmployees();
                break;
            case 'Add employee':
                addEmployee();
                break;
            case 'Update employee role':
                updateEmployee();
                break;
            case 'View all roles':
                viewAllRoles();
                break;
            case 'Add role':
                addRole();
                break;
            case 'View all departments':
                viewAllDepartments();
                break;
            case 'Add department':
                addDepartment();
                break;
            case 'QUIT':
                process.exit(0);
            default:
                break;
            };
    });
};

//==================== VIEW FUNCTIONS ====================//

// view all employees
function viewAllEmployees() {
    // CONCAT_WS returns a space instead of NULL when there is no manager
    connection.query(`SELECT employee.id AS 'ID', employee.first_name AS 'First Name', employee.last_name AS 'Last Name', role.title AS 'Title', department.name AS 'Department', role.salary AS 'Salary', CONCAT_WS(' ', m.first_name, m.last_name) AS 'Manager'
                      FROM employee
                      INNER JOIN role
                      ON role.id = employee.role_id
                      INNER JOIN department
                      ON department.id = role.department_id
                      LEFT JOIN employee m
                      ON employee.manager_id = m.id
                      ORDER BY employee.id`,
                    function(err,res) {
                        if (err) throw err;
                        console.table('', res);
                        mainMenu();
                    });
};

// view all roles
function viewAllRoles() {
    connection.query(`SELECT role.id AS 'ID', role.title AS 'Role', department.name AS 'Department', role.salary AS 'Salary'
                      FROM role
                      JOIN department
                      ON role.department_id = department.id
                      ORDER BY role.id`,
                    function(err,res) {
                        if (err) throw err;
                        console.table('', res);
                        mainMenu();
                    });
};

// view all departments
function viewAllDepartments() {
    connection.query(`SELECT department.id AS 'ID', department.name AS 'Department'
                      FROM department
                      ORDER BY department.id`,
                    function(err,res) {
                        if (err) throw err;
                        console.table('', res);
                        mainMenu();
                    });
};

//==================== ADD FUNCTIONS ====================//

// add employee
function addEmployee() {
    // get the role choices and map them based on title and id
    connection.query('SELECT * from role', function(err, res) {
        if (err) throw err;
        const roles = res.map(({ id, title }) => ({ name: title, value: id }));

        // get the manager choices and map them based on first name + last name and id
        connection.query('SELECT * from employee', function(err, res) {
            if (err) throw err;
            const managers = res.map(({ id, first_name, last_name }) => ({ name: first_name + ' ' + last_name, value: id }));
            managers.unshift({ name: 'NONE', value: null });

            // proceed with prompts once all queries have been made successfully
            inquirer.prompt([
                {
                    name: 'firstName',
                    type: 'input',
                    message: "What is the employee's first name?",
                },
                {
                    name: 'lastName',
                    type: 'input',
                    message: "What is the employee's last name?",
                },
                {
                    name: 'role',
                    type: 'list',
                    message: "What is the employee's role?",
                    choices: roles
                },
                {
                    name: 'manager',
                    type: 'list',
                    message: "Who is the employee's manager?",
                    choices: managers
                }
            ]).then(data => {
                connection.query('INSERT INTO employee SET ?',
                {
                    first_name: data.firstName,
                    last_name: data.lastName,
                    role_id: data.role,
                    manager_id: data.manager
                },
                function(err) {
                    if (err) throw err;
                    console.log('\nAdded ' + data.firstName + ' ' + data.lastName + ' to the database.\n');
                    mainMenu();
                });
            });
        });
    });
};   

// update employee
function updateEmployee() {
    // get the employee choices and map them based on first name + last name and id
    connection.query('SELECT * from employee', function(err, res) {
        if (err) throw err;
        const employees = res.map(({ id, first_name, last_name }) => ({ name: first_name + ' ' + last_name, value: id }));
    
        // get the role choices and map them based on title and id
        connection.query('SELECT * from role', function(err, res) {
            if (err) throw err;
            const roles = res.map(({ id, title }) => ({ name: title, value: id }));

            // proceed with prompts once all queries have been made successfully
            inquirer.prompt([
                {
                    name: 'employee',
                    type: 'list',
                    message: "Which employee's role would you like to update?",
                    choices: employees
                },
                {
                    name: 'role',
                    type: 'list',
                    message: 'Which role would you like to assign to the selected employee?',
                    choices: roles
                }
            ]).then(data => {
                connection.query('UPDATE employee SET role_id = ? WHERE id = ?', [data.role, data.employee],
                function(err) {
                    if (err) throw err;
                    console.log("\nUpdated employee's role.\n");
                    mainMenu();
                });
            });
        });
    });
};

// add role
function addRole() {
    // get the department choices and map them based on title and id
    connection.query('SELECT * from department', function(err, res) {
        if (err) throw err;
        const departments = res.map(({ id, name }) => ({ name: name, value: id }));

        // proceed with prompts once all queries have been made successfully
        inquirer.prompt([
            {
                name: 'title',
                type: 'input',
                message: 'What is the name of the role?'
            },
            {
                name: 'salary',
                type: 'input',
                message: 'What is the salary of the role?'
            },
            {
                name: 'department',
                type: 'list',
                message: 'What department does the role belong to?',
                choices: departments
            }
        ]).then(data => {
            connection.query('INSERT INTO role SET ?',
                {
                    title: data.title,
                    salary: data.salary,
                    department_id: data.department
                },
                function(err) {
                    if (err) throw err;
                    console.log('\nAdded ' + data.title + ' to the database.\n');
                    mainMenu();
            });
        });
    });
};

// add department
function addDepartment() {
    inquirer.prompt([
        {
            name: 'name',
            type: 'input',
            message: 'What is the name of the department?'
        }
    ]).then(data => {
        connection.query('INSERT INTO department SET ?',
            {
                name: data.name
            },
            function(err) {
                if (err) throw err;
                console.log('\nAdded ' + data.name + ' to the database.\n');
                mainMenu();
        });
    });
}