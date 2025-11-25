/** @format */

import { iconStroke } from "../../config/config";
import React, { useEffect, useRef, useState } from "react";
import Page from "../../components/Page";
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import axios from "axios";

import toast from "react-hot-toast";
import { mutate } from "swr";
import { useStocks } from "../../controllers/stock.controller";

function StockDetails() {
  const [itemdata, setItemdata] = useState("Item 1");
  const [tableData, settableData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const { APIURL, data, error, isLoading } = useStocks();
  console.log("api data => ", APIURL, data, error, isLoading);

  useEffect(() => {
    if (data) {
      settableData(data.data);
    }
  }, [data]);

  return (
    <div>
      <div>
        <Page className="px-8 py-6">
          <div className="flex items-center gap-6">
            <h3 className="text-3xl font-light">Add Stock </h3>
            <button
              onClick={() => document.getElementById("modal-add").showModal()}
              className="rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-2 py-1 flex items-center gap-1"
            >
              <IconPlus size={22} stroke={iconStroke} /> New
            </button>
          </div>

          <div className="mt-8 w-full">
            <table className="w-full border overflow-x-auto">
              <thead>
                <tr>
                  <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start  md:w-40">
                    Item Name
                  </th>
                  <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start  md:w-20">
                    Stock Alert
                  </th>

                  <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start  md:w-20">
                    Batch ID
                  </th>

                  <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                    Full Stock Qty
                  </th>
                  <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                    Product Sale Unit
                  </th>
                  <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                    Product Purchase Unit
                  </th>
                  <th className="px-3 py-2 bg-gray-100 font-medium text-gray-500 text-start md:w-28">
                    View More
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableData?.map((data, index) => {
                  // const { id, title, rate, type } = data;

                  return (
                    <tr key={index}>
                      {/* <td className="px-3 py-2 text-start">{index + 1}</td>
                      <td className="px-3 py-2 text-start">{title}</td>
                      <td className="px-3 py-2 text-start">{rate}%</td>
                      <td className="px-3 py-2 text-start">{type}</td> */}

                      {/* <td className="px-3 py-2 text-start">{index + 1}</td> */}
                      <td className="px-3 py-2 text-start">{data.name}</td>
                      <td className="px-3 py-2 text-start">
                        {data.stock_alert}
                      </td>
                      <td className="px-3 py-2 text-start">{data.BATCHID}</td>
                      <td className="px-3 py-2 text-start">
                        {data.FULLSTOCKQTY}
                      </td>
                      <td className="px-3 py-2 text-start">
                        {data.product_sale_unit}
                      </td>
                      <td className="px-3 py-2 text-start">
                        {data.product_purchase_unit}
                      </td>

                      <td className="px-3 py-2 text-start flex flex-wrap gap-2 items-center">
                        <button
                          onClick={() => {
                            btnViewMore(id, title, rate, type);
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition active:scale-95"
                        >
                          <IconPencil stroke={iconStroke} />
                        </button>
                        {/* <button
                          onClick={() => {
                            btnDelete(id);
                          }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-gray-100 transition active:scale-95"
                        >
                          <IconTrash stroke={iconStroke} />
                        </button> */}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <dialog id="modal-add" className="modal modal-bottom sm:modal-middle">
            <div className="modal-box">
              <h3 className="font-bold text-lg"> Stock Details </h3>

              <div className="modal-action">
                <form method="dialog">
                  {/* if there is a button in form, it will close the modal */}
                  <button className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500">
                    Close
                  </button>
                  <button
                    onClick={() => {
                      btnAdd();
                    }}
                    className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
                  >
                    Submit
                  </button>
                </form>
              </div>
            </div>
          </dialog>

          <dialog
            id="modal-update"
            className="modal modal-bottom sm:modal-middle"
          >
            <div className="modal-box">
              <div className="modal-action">
                <form method="dialog">
                  {/* if there is a button in form, it will close the modal */}
                  <button
                    onClick={() => {
                      btnClose();
                    }}
                    className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
                  >
                    Close
                  </button>
                </form>
              </div>
            </div>
          </dialog>
        </Page>
      </div>
    </div>
  );
}

export default StockDetails;
