import bcrypt from "bcrypt";
import _ from "lodash";
import { ApiError } from "./ApiError.js";


export const comparePassword = async (password="", hashedPassword, res) =>{
    try
    {
        // check the payload args are valid
        // compare both 
        // return results
        
        const isEqual = await  bcrypt.compare(password, hashedPassword);
        
        if(isEqual)
        {
            return true;
        }

        return false;
    }
    catch(err)
    {
        
       throw new ApiError(403, err?.message || "ComparePassword : Something went wrong");
    }
};