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
export default function HallReservationCard({
    id,
    // customer_id,
    customer_name,
    // customer_email,
    // customer_phone,
    start_time,
    date,
    hall_id,
    end_time,
    guest_count,
    room_no,
    total,
    discount,
    sub_total,
    advance_payment,
    payment_type,
    status,
    btnUpdate,
    btnDelete,
  }) {
    return (
      <div
        key={id}
        className="flex items-center gap-4 p-4 border text-restro-green-dark border-restro-border-green-light rounded-2xl"
      >
        <div className="flex-1">
          <div className="flex items-center justify-center w-full h-full py-2 text-base font-bold text-center text-gray-500 bg-gray-100 rounded-lg">
          <p className="ml-5 text-xs text-gray-400">Hall: {hall_id}</p> 
            {/* In : {dateLocal1} */}
            <p className="text-sm text-gray-500">
              Start : {start_time} 
            </p>
  
            {/* Out : {dateLocal2} */}
            <p className="text-sm text-gray-500">
              End : {end_time} 
            </p>
          </div>
          <p className="ml-5 text-sm font-bold">{customer_name}</p>
          <div className="flex items-center gap-4 ml-5 text-sm text-restro-green-dark">
            <div className="flex items-center gap-2">
              <IconFriends stroke={iconStroke} size={18} />
              {guest_count}
            </div>
          </div>
          
          <p className="ml-5 text-xs text-gray-400">Status: {status}</p>
          <p className="ml-5 text-xs text-gray-400">Date: {date}</p> 
           <p className="ml-5 text-xs text-gray-400">Room: {room_no}</p> 
        </div>
  
        <div className="flex items-center">
          <button
            onClick={btnUpdate}
            className="flex items-center justify-center w-6 h-6 text-gray-500 transition rounded-full hover:bg-gray-100 active:scale-95"
          >
            <IconPencil size={18} stroke={iconStroke} />
          </button>
          <button
            onClick={btnDelete}
            className="flex items-center justify-center w-6 h-6 text-red-500 transition rounded-full hover:bg-gray-100 active:scale-95"
          >
            <IconCalendarX size={18} stroke={iconStroke} />
          </button>
        </div>
      </div>
    );
  }
  