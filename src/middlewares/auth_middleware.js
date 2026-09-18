import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import {asyncHandler} from "../utils/AsyncHandler.js";
import { prisma } from "../client/client.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const authentication = asyncHandler(async (req, res, next)=>{
    try{
        
        const token = req.header("Authorization")?.replace("Bearer ", "") || req.cookies.accessToken;
        
        if(!token)
        {
            return res.status(401).json(new ApiResponse(401, "Authorization: You are not authorized."));
        } 
        
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find User of Given Token Credentials
        const user = await prisma.user.findFirst({
            where : {
                user_email : decodedToken.user_email
            }
        });

        if(!user)
        {
            throw new ApiError(401, "User Not Found");
        }

        req.user = user;
        next();
    }
    catch(error)
    {
        throw new ApiError (407, error?.message || "Invalid Access Token");
    }
});

export default authentication;