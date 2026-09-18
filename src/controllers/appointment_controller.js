import { prisma } from "../client/client.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

// ── Helper: "10:00 AM" jaise time string ko Prisma @db.Time ke liye Date object mein convert karo ──
function parseTimeString(timeStr) {
  const date = new Date(`1970-01-01T00:00:00`);
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);

  if (!match) {
    throw new ApiError(400, "Invalid time format. Use 'HH:mm' or 'hh:mm AM/PM'");
  }

  let [, hours, minutes, meridiem] = match;
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);

  if (meridiem) {
    if (meridiem.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (meridiem.toUpperCase() === "AM" && hours === 12) hours = 0;
  }

  date.setUTCHours(hours, minutes, 0, 0);
  return date;
}

// ── POST /appointments — Naya appointment book karo ─────────────────────────
export const createAppointment = asyncHandler(async (req, res) => {
  const {
    doctors_doctors_id,
    appointment_date,
    appointment_time,
    appointment_reason,
  } = req.body;

  const user_user_id = req.user?.user_id; // auth middleware se aana chahiye

  if (!user_user_id) {
    throw new ApiError(401, "Unauthorized — user not found in request");
  }

  if (!doctors_doctors_id || !appointment_date || !appointment_time) {
    throw new ApiError(400, "doctors_doctors_id, appointment_date and appointment_time are required");
  }

  // ── Doctor exist karta hai aur active hai ──
  const doctor = await prisma.doctors.findFirst({
    where: {
      doctors_id: Number(doctors_doctors_id),
      doctors_isactive: 1,
    },
  });

  if (!doctor) {
    throw new ApiError(404, "Doctor not found or inactive");
  }

  const parsedDate = new Date(appointment_date);
  const parsedTime = parseTimeString(appointment_time);

  if (isNaN(parsedDate.getTime())) {
    throw new ApiError(400, "Invalid appointment_date");
  }

  // ── Past date/time book na ho ──
  const now = new Date();
  if (parsedDate < new Date(now.toDateString())) {
    throw new ApiError(400, "Cannot book an appointment in the past");
  }

  // ── Slot already booked to nahi ──
  const existing = await prisma.appointment.findFirst({
    where: {
      doctors_doctors_id: Number(doctors_doctors_id),
      appointment_date: parsedDate,
      appointment_time: parsedTime,
      appointment_deletedat: null,
      appointment_status: { not: "Cancelled" },
    },
  });

  if (existing) {
    throw new ApiError(409, "This time slot is already booked for the selected doctor");
  }

  const appointment = await prisma.appointment.create({
    data: {
      appointment_date: parsedDate,
      appointment_time: parsedTime,
      appointment_reason: appointment_reason || null,
      appointment_status: "Pending",
      appointment_createdat: new Date(),
      user_user_id: Number(user_user_id),
      doctors_doctors_id: Number(doctors_doctors_id),
    },
    include: {
      doctors: {
        select: {
          doctors_full_name: true,
          doctors_intials: true,
        },
      },
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, appointment, "Appointment booked successfully"));
});

// ── GET /appointments — Sab appointments (optionally filter by user/doctor/status) ──
export const getAppointments = asyncHandler(async (req, res) => {
  const { doctor_id, status, date } = req.query;
  const user_user_id = req.user?.user_id;

  const where = {
    appointment_deletedat: null,
  };

  if (user_user_id) {
    where.user_user_id = Number(user_user_id);
  }

  if (doctor_id) {
    where.doctors_doctors_id = Number(doctor_id);
  }

  if (status) {
    where.appointment_status = status;
  }

  if (date) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new ApiError(400, "Invalid date filter");
    }
    where.appointment_date = parsedDate;
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: [{ appointment_date: "asc" }, { appointment_time: "asc" }],
    include: {
      doctors: {
        select: {
          doctors_full_name: true,
          doctors_intials: true,
          doctors_rating: true,
        },
      },
      user: {
        select: {
          user_name: true,
          user_email: true,
        },
      },
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, appointments, "Appointments fetched successfully"));
});

// ── GET /appointments/:id — Ek specific appointment ──────────────────────────
export const getAppointmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const appointment = await prisma.appointment.findFirst({
    where: {
      appointment_id: Number(id),
      appointment_deletedat: null,
    },
    include: {
      doctors: true,
      user: {
        select: {
          user_name: true,
          user_email: true,
          user_phone: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, appointment, "Appointment fetched successfully"));
});