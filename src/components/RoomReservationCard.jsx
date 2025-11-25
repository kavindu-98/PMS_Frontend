/** @format */

import React from "react";
import {
  IconArmchair,
  IconCalendarX,
  IconFriends,
  IconPencil,
  IconInfoSquareRounded,
  IconDoor,
} from "@tabler/icons-react";
import { iconStroke } from "../config/config";
export default function RoomReservationCard({
  unique_code,
  dateLocal1,
  timeLocal1,
  dateLocal2,
  timeLocal2,
  customer_name,
  customer_id,
  people_count,
  table_title,
  notes,
  status,
  createdAt,
  btnUpdate,
  btnDelete,
}) {
  return (
    <div
      key={unique_code}
      className="text-restro-green-dark border border-restro-border-green-light rounded-2xl p-4 flex gap-4 items-center"
    >
      <div className="flex-1">
        <div className="w-full h-full text-base text-gray-500 py-2 font-bold text-center rounded-lg flex items-center justify-center bg-gray-100">
          {/* In : {dateLocal} */}
          <p className="text-gray-500 text-sm">
            In : {dateLocal1} {timeLocal1}
          </p>

          <p className="text-gray-500 text-sm">
            Out : {dateLocal2} {timeLocal2}
          </p>
        </div>
        <p className="font-bold text-sm ml-5">
          {customer_name} - {customer_id}
        </p>
        <div className="flex items-center gap-4 text-sm text-restro-green-dark ml-5">
          <div className="flex items-center gap-2">
            <IconFriends stroke={iconStroke} size={18} />
            {people_count || "N/A"}
          </div>
          <div className="flex items-center text-xs gap-2">
            <IconDoor stroke={iconStroke} size={18} />
            Room No: {table_title || "N/A"}
          </div>
        </div>
        {/* <p className="text-xs text-gray-700"> at: {createdAt}</p> */}
        {notes && (
          <div className="tooltip tooltip-bottom ml-5" data-tip={notes}>
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
              <IconInfoSquareRounded size={18} stroke={iconStroke} /> View Notes
            </p>
          </div>
        )}
        <p className="text-xs text-gray-400 ml-5">Status: {status}</p>
        <p className="text-xs text-gray-400 ml-5">Created at: {createdAt}</p>
      </div>
      {/* <div className="w-20 h-full text-base text-gray-500 py-2 font-bold text-center rounded-lg flex items-center justify-center bg-gray-100">
        Out : {dateLocal}
      </div> */}

      <div className="flex items-center">
        <button
          onClick={btnUpdate}
          className="w-6 h-6 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition active:scale-95"
        >
          <IconPencil size={18} stroke={iconStroke} />
        </button>
        <button
          onClick={btnDelete}
          className="w-6 h-6 rounded-full flex items-center justify-center text-red-500 hover:bg-gray-100 transition active:scale-95"
        >
          <IconCalendarX size={18} stroke={iconStroke} />
        </button>
      </div>
    </div>
  );
}
