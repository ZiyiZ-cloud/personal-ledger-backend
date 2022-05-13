const {BadRequestError} = require('../expressError');

function sqlUpdate(updateData, jsToSql){
    // get keys for updatedata
    const keys = Object.keys(updateData);
    // if there is no updatedata, throw error message
    if(keys.length===0) throw new BadRequestError('No data');

    // set up coresponding column and index to the value for updating data
    const columns = keys.map((columnName, index)=>
        `"${jsToSql[columnName] || columnName}" = $${index+1}`
    );
    // return all the updating data column sql and value
    return {
        setColumns: columns.join(", "),
        values:Object.values(updateData)
    };
}

module.exports = {sqlUpdate}