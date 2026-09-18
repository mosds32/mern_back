import bcrypt from "bcrypt";

import _ from "lodash";

export const hashPassword =  async (password) => {
    try
    {
        // check password arg is not empty and is valid type
        // generate hashed Password with bcrypt and Salt
        // if everything goes well return hashed password else throw error

        const isEmpty = _.isEmpty(password) || (!_.isString(password));

        if(isEmpty){
            console.log(401, "HashPassword : Field is empty or incorrect type");
        }
        
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);

        if(!hashedPassword)
        {
            console.log(401, "HashPassword : Password is not hashed");
        }

        return hashedPassword;
    }

    catch(err)
    {
        console.log(403, "HashPassword : Something went wrong");
    }
};