
const jsonschema = require('jsonschema');

const express = require('express');
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");

const router = express.Router();

// add new user

router.post('/', async function(req,res,next){
    try{
        // use jsonschema to validate new user information meet requirement

        // once successful validate new data, add new user information to the database
        const user = await User.register(req.body);
        const token = createToken(user);
        return res.status(201).json({user,token})

    }catch(err){
        return next(err)
    }
})

// get all users information

router.get('/',async function(req,res,next){
    try{
        const users = await User.findAll();
        return res.json({users})
    }catch(err){
        return next(err)
    }
})

//get single user information

router.get('/:username',ensureCorrectUser,async function(req,res,next){
    try{
        const user = await User.findUser(req.params.username);
        return res.json({user})
    }catch(err){
        return next(err)
    }
})

// update user information
router.patch('/:username',ensureCorrectUser,async function(req,res,next){
    try{
        // use jsonschema to validate new data

        // once validate update data fit requirement, update and return new user information
        const user = await User.updateUser(req.params.username,req.body);
        return res.json({user});
    }catch(err){
        return next(err)
    }
})

// delete user
router.delete('/:username',ensureCorrectUser,async function(req,res,next){
    try {
        await User.removeUser(req.params.username);
        return res.json({ deleted: req.params.username });
      } catch (err) {
        return next(err);
      }
})

module.exports = router;