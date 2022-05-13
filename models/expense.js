
const db = require("../db");
const { NotFoundError} = require("../expressError");
const { sqlUpdate } = require("../helpers/sql");

class Expenses{
    
    // create new expense
    static async createExpense(username,data) {
        const result = await db.query(
              `INSERT INTO expenses(amount,
                                    category,
                                    detail,
                                    date,
                                    username)
               VALUES ($1, $2, $3, $4, $5)
               RETURNING id, amount, category, detail, date, username`,
            [
              data.amount,
              data.category,
              data.detail,
              data.date,
              username
            ]);
        let expense = result.rows[0];
    
        return expense;
    }

    // return one user expenses
    static async getExpense(username){
        const userRes = await db.query(
            `SELECT username,
                    first_name,
                    last_name,
                    email
                FROM users
                WHERE username = $1`,
            [username]
        );
    
        const user = userRes.rows[0];
    
        if (!user) throw new NotFoundError(`No user: ${username}`);
                
        const userExpenseRes = await db.query(
            `SELECT e.amount,
                    e.category,
                    e.detail,
                    e.date
                FROM expenses AS e
                WHERE e.username = $1`, [username]);
                
        return userExpenseRes.rows;

    }   

    // get all expenses based on category
    static async getByCategory(username,category){
        const userRes = await db.query(
            `SELECT username,
                    first_name,
                    last_name,
                    email
                FROM users
                WHERE username = $1`,
            [username]
        );
    
        const user = userRes.rows[0];
    
        if (!user) throw new NotFoundError(`No user: ${username}`);
                
        const userExpenseRes = await db.query(
            `SELECT amount,
                    category,
                    detail,
                    date
                FROM expenses
                WHERE username = $1 AND category = $2`, [username,category]);
                
        return userExpenseRes.rows;
    }

    // get annual expenses
    static async getAnnual(username,year){
        const userRes = await db.query(
            `SELECT username,
                    first_name,
                    last_name,
                    email
                FROM users
                WHERE username = $1`,
            [username]
        );
    
        const user = userRes.rows[0];
    
        if (!user) throw new NotFoundError(`No user: ${username}`);
                
        const userExpenseRes = await db.query(
            `SELECT amount,
                    category,
                    detail,
                    date
            FROM expenses
            WHERE username = $1 AND EXTRACT(year FROM date) = $2`,[username,year]
        )

        return userExpenseRes.rows;
    }

    // get monthly expenses
    static async getMonthly(username,year,month){
        const userRes = await db.query(
            `SELECT username,
                    first_name,
                    last_name,
                    email
                FROM users
                WHERE username = $1`,
            [username]
        );
    
        const user = userRes.rows[0];
    
        if (!user) throw new NotFoundError(`No user: ${username}`);
                
        const userExpenseRes = await db.query(
            `SELECT amount,
                    category,
                    detail,
                    date
            FROM expenses
            WHERE username = $1 AND EXTRACT(year FROM date) = $2 AND EXTRACT(month FROM date) = $3`,[username,year,month]
        )

        return userExpenseRes.rows;
    }


    // update expense
    static async updateExpense(id,data){
        // set up variables for sql update
        const{setColumns, values} = sqlUpdate(
            data,
            {
                amount: 'amount',
                category:'category',
                detail:'detail',
                date:'date'
            }
        );
        // set up username value index to look for correct user
        const expenseIdVarIdx = "$" + (values.length+1);
        
        // set up sql command
        const querySql = `UPDATE expenses 
                      SET ${setColumns} 
                      WHERE id = ${expenseIdVarIdx} 
                      RETURNING amount,
                                category,
                                detail,
                                date`;
        const result = await db.query(querySql, [...values, id]);
        const expense = result.rows[0];

        if (!expense) throw new NotFoundError(`No expense: ${id}`);

        return expense;
    }

    // delete expense

    static async deleteExpense(id) {
        const result = await db.query(
              `DELETE
               FROM expenses
               WHERE id = $1
               RETURNING id`, [id]);
        const expense = result.rows[0];
    
        if (!expense) throw new NotFoundError(`No expense: ${id}`);
    }

}

module.exports = Expenses;