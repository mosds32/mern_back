
import { prisma } from "../client/client.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
export const getDoctors = asyncHandler(async (req, res) => {
    try {
        const doctors = await prisma.doctors.findMany({
            include: {
                speciality: true,
            },
        });

        if (!doctors || doctors.length === 0) {
            return res
                .status(404)
                .json(new ApiResponse(404, "Get Doctors: No doctors found"));
        }

        return res
            .status(200)
            .json(new ApiResponse(
                200,
                "Doctors with speciality",
                doctors
            ));

    } catch (err) {
        throw new ApiError(403, err?.message || "Get Doctors: Something went wrong");
    }
});