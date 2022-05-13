
const db = require('../db');
const bcrypt = require("bcrypt");
const { sqlUpdate } = require("../helpers/sql");
const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");
const e = require('express');

class User{

    //authenticate user with username and password

    static async authenticate(username, password){
        //check if user exist
        const result = await db.query(
            `SELECT username,
                    password,
                    first_name,
                    last_name,
                    email
             FROM users
             WHERE username = $1`,
            [username],
        );

        const user = result.rows[0]

        if(user){
            const checkPassword = await bcrypt.compare(password,user.password);
            if(checkPassword===true){
                delete user.password;
                return user;
            }
        }
        throw new UnauthorizedError("Invalid username/password")
    }

    // register user

    static async register({username,password,firstName,lastName,email}){
        const duplicateCheck = await db.query(
            `SELECT username
            FROM users
            WHERE username = $1`,[username]
        );

        if(duplicateCheck.rows[0]){
            throw new BadRequestError(`Duplicate username: ${username}`);
        }

        const hashedPassword = await bcrypt.hash(password,BCRYPT_WORK_FACTOR);

        const result = await db.query(
            `INSERT INTO users
             (username,
              password,
              first_name,
              last_name,
              email)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING username, first_name, last_name, email`,
          [
            username,
            hashedPassword,
            firstName,
            lastName,
            email,
          ],
      );

        const user = result.rows[0]

        return user
    }

    // find all users information

    static async findAll(){
        const result = await db.query(
            `SELECT username,
                    first_name,
                    last_name,
                    email
             FROM users
             ORDER BY username`,
        );

        return result.rows;
    }

    // given a username, return information about user

    static async findUser(username){
        const userRes = await db.query(
            `SELECT username,
                    first_name,
                    last_name,
                    email
             FROM users
             WHERE username = $1`,[username]
        );

        const user = userRes.rows[0];

        if(!user) throw new NotFoundError(`No user: ${username}`);

        return user
    }

    //update user data

    static async updateUser(username, data){

        // this allows user to change their password and store new hashed password
        if(data.password){
            data.password = await bcrypt.hash(data.password,BCRYPT_WORK_FACTOR);
        }
        // set up variables for sql update
        const{setColumns, values} = sqlUpdate(
            data,
            {
                firstName:"first_name",
                lastName:'last_name',
                email:'email'
            }
        );
        // set up username value index to look for correct user
        const usernameVarIdx = "$" + (values.length+1);
        
        // set up sql command
        const querySql = `UPDATE users 
                      SET ${setColumns} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name,
                                last_name,
                                email`;
        const result = await db.query(querySql, [...values, username]);
        const user = result.rows[0];

        if (!user) throw new NotFoundError(`No user: ${username}`);

        delete user.password;
        return user;

    }

    // delete user

    static async removeUser(username){
        let result = await db.query(
            `DELETE
            FROM users
            WHERE username = $1
            RETURNING username`,[username],
        );
        const user = result.rows[0];

        if(!user) throw new NotFoundError(`No user: ${username}`)
    }



}

module.exports = User;