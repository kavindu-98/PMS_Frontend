/** @format */

import React, { useRef, useState } from "react";
import Page from "../../components/Page";
import {
  searchInquiries,
  useWeddingInquiries,
} from "../../controllers/settings.controller";
import toast from "react-hot-toast";
import { mutate } from "swr";

export default function WeddingInquiryPage() {
  const { APIURL, data: inquiries, error, isLoading } = useWeddingInquiries();

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  const handleSearch = async () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both start and end dates!");
      return;
    }

    try {
      toast.loading("Searching...");

      const res = await searchInquiries(fromDate, toDate);

      if (res.status === 200) {
        setFilteredData(res.data); // Set the filtered data to display
        toast.dismiss();
        toast.success("Searched successfully");
        mutate(APIURL); // Refresh the data
      }
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Failed to fetch inquiries!");
    }
  };

  if (isLoading) {
    return <Page className="px-8 py-6">Please wait...</Page>;
  }

  if (error) {
    console.error(error);
    return <Page className="px-8 py-6">Error loading data, Try Later!</Page>;
  }

  return (
    <Page className="px-8 py-6">
      <div className="flex items-center justify-between">
        <h3 className="text-3xl font-light">Wedding Inquiry</h3>
        <div className="flex items-center gap-3">
          <label>From : </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <label>To : </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />

          <button
            onClick={handleSearch}
            className="px-4 py-1 text-white transition rounded-lg bg-restro-green hover:bg-restro-green/80 active:scale-95 outline-restro-border-green-light"
          >
            Search
          </button>
        </div>
      </div>

      <div className="w-full mt-8">
        <table className="w-full overflow-x-auto border">
          <thead>
            <tr>
              <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-10">
                #
              </th>
              <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                Customer Id
              </th>
              <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                Customer Name
              </th>

              <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                Visiting Date
              </th>

              <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-20">
                Visiting Time
              </th>

              <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-20">
                Guest Count
              </th>

              <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                Purpose Of Visit
              </th>

              <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                Remarks
              </th>
              {/* <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start md:w-28">
                Actions
              </th> */}
            </tr>
          </thead>
          <tbody>
            {(filteredData?.length > 0 ? filteredData : inquiries).map(
              (inquiry, index) => {
                const {
                  id,
                  customer_id,
                  name,
                  visiting_date,
                  visiting_time,
                  guest_count,
                  purpose_of_visit,
                  remarks,
                } = inquiry;
                return (
                  <tr key={index}>
                    <td className="px-3 py-2 text-start">{index + 1}</td>
                    <td className="px-3 py-2 text-start">{customer_id}</td>
                    <td className="px-3 py-2 text-start">{name}</td>
                    <td className="px-3 py-2 text-start">{visiting_date}</td>
                    <td className="px-3 py-2 text-start">{visiting_time}</td>
                    <td className="px-3 py-2 text-start">{guest_count}</td>
                    <td className="px-3 py-2 text-start">{purpose_of_visit}</td>
                    <td className="px-3 py-2 text-start">{remarks}</td>
                    {/* <td className="flex flex-wrap items-center gap-2 px-3 py-2 text-start">
                    <button
                      onClick={() => {
                        btnShowUpdate(id, title, rate, type);
                      }}
                      className="flex items-center justify-center w-8 h-8 text-gray-500 transition rounded-full hover:bg-gray-100 active:scale-95"
                    >
                      <IconPencil stroke={iconStroke} />
                    </button>
                    <button
                      onClick={()=>{
                        btnDelete(id);
                      }}
                      className="flex items-center justify-center w-8 h-8 text-red-500 transition rounded-full hover:bg-gray-100 active:scale-95"
                    >
                      <IconTrash stroke={iconStroke} />
                    </button>
                  </td> */}
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
