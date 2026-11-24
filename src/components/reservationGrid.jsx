/** @format */

import React from "react";
import { useRoomReservationsGrid } from "../controllers/reservations.controller";

function ReservationGrid({ type, from, to }) {
  const filters = [
    { key: "today", value: "Today" },
    { key: "tomorrow", value: "Tomorrow" },
    { key: "yesterday", value: "Yesterday" },
    { key: "last_7days", value: "Last 7 Days" },
    { key: "this_month", value: "This Month" },
    { key: "last_month", value: "Last Month" },
    { key: "custom", value: "Custom" },
  ];

  const { data, error, isLoading } = useRoomReservationsGrid(type, from, to);

  console.log("Room data:", data); // Debugging to confirm API response
  if (isLoading) return <div>Loading room reservations...</div>;
  if (error) return <div>Error loading room data. Please try again later.</div>;

  // Ensure that all rooms (available and unavailable) are processed
  const rooms = data?.data || []; // Handle the case where no data is returned

  return (
    <div className="mt-5">
      <h2>Room Availability for {filters.find((f) => f.key == type).value}</h2>

      <div className="p-4 px-8">
        <div className="grid grid-cols-10 gap-4">
          {rooms?.map((room) => (
            <div
              key={room.room_no}
              style={{
                backgroundColor:
                  room.color_code ||
                  (room.status === "Available" ? "#00FF00" : "#C70039"),
              }}
              className="w-12 h-8 flex items-center justify-center rounded cursor-pointer"
              title={`${room.room_no} - ${room.room_category} (${room.status})`} // Tooltip with room details
            >
              <span
                className={`${
                  room.status === "Available" ? "text-black" : "text-white"
                } text-sm`}
              >
                {room.room_no}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex justify-around mt-4">
        <div
          className="w-28 h-8 text-black text-center flex items-center justify-center rounded"
          style={{ backgroundColor: "#cbcbca" }}
        >
          Available
        </div>
        <div
          className="w-28 h-8 text-white text-center flex items-center justify-center rounded"
          style={{ backgroundColor: "#C70039" }}
        >
          Unavailable
        </div>

        <div
          className="w-28 h-8 text-black text-center flex items-center justify-center rounded"
          style={{ backgroundColor: "#faf239" }}
        >
          Half Booked
        </div>

        <div
          className="w-28 h-8 text-black text-center flex items-center justify-center rounded"
          style={{ backgroundColor: "#cbcbca" }}
        >
          Maintenance
        </div>
      </div>
    </div>
  );
}

export default ReservationGrid;
