/** @format */

import React, { useRef } from "react";
import Page from "../../components/Page";
import {
  IconPencil,
  IconPlus,
  IconTrash,
  IconArmchair2,
  IconQrcode,
  IconDoor,
} from "@tabler/icons-react";
import { iconStroke } from "../../config/config";
import {
  addNewRoom,
  deleteRoom,
  updateRoom,
  useRooms,
  useTaxes,
} from "../../controllers/settings.controller";
import toast from "react-hot-toast";
import { mutate } from "swr";
import { getTableQRMenuLink } from "../../helpers/QRMenuHelper";

import QRCode from "qrcode";

export default function RoomSettingsPage() {
  const roomNameRef = useRef();
  const roomCategoryRef = useRef();
  const bedCountRef = useRef();
  const fbpriceRef = useRef();
  const hbpriceRef = useRef();
  const bbpriceRef = useRef();
  const ropriceRef = useRef();
  const maxPersonCountRef = useRef();
  const descriptionRef = useRef();
  const roomNameUpdateRef = useRef();
  const roomCategoryUpdateRef = useRef();
  const bedCountUpdateRef = useRef();
  const fbpriceUpdateRef = useRef();
  const hbpriceUpdateRef = useRef();
  const bbpriceUpdateRef = useRef();
  const ropriceUpdateRef = useRef();
  const taxIdRef = useRef();
  const taxIdUpdateRef = useRef();
  const smokingUpdateRef = useRef();
  const smokingRef = useRef();

  const maxPersonCountUpdateRef = useRef();
  const descriptionUpdateRef = useRef();

  const tableIdRef = useRef();

  const { APIURL, data: rooms, error, isLoading } = useRooms();
  const {
    APIURL: APIURLTaxes,
    data: taxes = [],
    error: errorTaxes,
    isLoading: isLoadingTaxes,
  } = useTaxes();

  if (isLoading) {
    return <Page className="px-8 py-6">Please wait...</Page>;
  }

  if (error) {
    console.error(error);
    return <Page className="px-8 py-6">Error loading data, Try Later!</Page>;
  }

  if (isLoadingTaxes) {
    return <p>Loading taxes...</p>;
  }

  if (errorTaxes) {
    return <p className="text-red-500">Error loading taxes</p>;
  }

  const btnDelete = async (id) => {
    const isConfirm = window.confirm(
      "Are you sure! This process is irreversible!"
    );

    if (!isConfirm) {
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await deleteRoom(id);

      if (res.status == 200) {
        await mutate(APIURL);
        toast.dismiss();
        toast.success(res.data.message);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);

      toast.dismiss();
      toast.error(message);
    }
  };
  const handleInputChangeTax = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      taxId: value, // ✅ Ensure taxId is updated correctly
    }));
  };

  async function btnAdd() {
    const roomNo = roomNameRef.current.value;
    const roomCategory = roomCategoryRef.current.value;
    const bedCount = bedCountRef.current.value;
    const maxPerson = maxPersonCountRef.current.value;
    const description = descriptionRef.current.value;
    const fullBoard = fbpriceRef.current.value;
    const halfBoard = hbpriceRef.current.value;
    const bB = bbpriceRef.current.value;
    const roomOnly = ropriceRef.current.value;
    const taxId = taxIdRef.current.value || null;
    const smokingFacility = smokingRef.current.value;

    if (!roomNo) {
      toast.error("Please provide Room No!");
      return;
    }
    if (!roomCategory) {
      toast.error("Please provide Room Category");
      return;
    }
    if (!bedCount) {
      toast.error("Please provide Bed Count or '0'");
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await addNewRoom(
        roomNo,
        roomCategory,
        bedCount,
        maxPerson,
        description,
        fullBoard,
        halfBoard,
        bB,
        roomOnly,
        taxId,
        smokingFacility
      );

      if (res.status == 200) {
        roomNameRef.current.value = null;
        roomCategoryRef.current.value = null;
        bedCountRef.current.value = null;
        maxPersonCountRef.current.value = null;
        descriptionRef.current.value = null;
        fbpriceRef.current.value = null;
        hbpriceRef.current.value = null;
        bbpriceRef.current.value = null;
        ropriceRef.current.value = null;
        taxIdRef.current.value = null;
        smokingRef.current.value = null;

        await mutate(APIURL);
        toast.dismiss();
        toast.success(res.data.message);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);

      toast.dismiss();
      toast.error(message);
    }
  }

  const btnShowUpdate = async (
    id,
    room_no,
    room_category,
    bed_count,
    max_person,
    description,
    full_board,
    half_board,
    bb,
    room_only,
    tax_id,
    smoking_facility
  ) => {
    tableIdRef.current.value = id;
    roomNameUpdateRef.current.value = room_no || "";
    roomCategoryUpdateRef.current.value = room_category || "";
    bedCountUpdateRef.current.value = bed_count || "";
    maxPersonCountUpdateRef.current.value = max_person || "";
    descriptionUpdateRef.current.value = description || "";
    fbpriceUpdateRef.current.value = full_board || "";
    hbpriceUpdateRef.current.value = half_board || "";
    bbpriceUpdateRef.current.value = bb || "";
    ropriceUpdateRef.current.value = room_only || "";

    // Ensure taxId exists in select options
    if (taxes.some((tax) => tax.id === tax_id)) {
      taxIdUpdateRef.current.value = tax_id;
    } else {
      taxIdUpdateRef.current.value = "";
    }

    // Ensure smoking facility is valid
    const validSmokingValues = ["smoking", "non-smoking"];
    smokingUpdateRef.current.value = validSmokingValues.includes(
      smoking_facility
    )
      ? smoking_facility
      : "";

    console.log("Modal Data Set:", { tax_id, smoking_facility });

    document.getElementById("modal-update").showModal();
  };

  const btnUpdate = async () => {
    const id = tableIdRef.current.value;
    const roomNo = roomNameUpdateRef.current.value;
    const roomCategory = roomCategoryUpdateRef.current.value;
    const bedCount = bedCountUpdateRef.current.value;
    const maxPerson = maxPersonCountUpdateRef.current.value;
    const description = descriptionUpdateRef.current.value;
    const fullBoard = fbpriceUpdateRef.current.value;
    const halfBoard = hbpriceUpdateRef.current.value;
    const bB = bbpriceUpdateRef.current.value;
    const roomOnly = ropriceUpdateRef.current.value;
    const taxId = taxIdUpdateRef.current.value;
    const smokingFacility = smokingUpdateRef.current.value;
    if (!roomNo) {
      toast.error("Please provide Room No!");
      return;
    }
    if (!roomCategory) {
      toast.error("Please provide Room Category");
      return;
    }
    if (!bedCount) {
      toast.error("Please provide Bed Count or '0'");
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await updateRoom(
        id,
        roomNo,
        roomCategory,
        bedCount,
        maxPerson,
        description,
        fullBoard,
        halfBoard,
        bB,
        roomOnly,
        taxId,
        smokingFacility
      );

      if (res.status == 200) {
        tableIdRef.current.value = null;
        roomNameUpdateRef.current.value = null;
        roomCategoryUpdateRef.current.value = null;
        bedCountUpdateRef.current.value = null;
        maxPersonCountUpdateRef.current.value = null;
        descriptionUpdateRef.current.value = null;
        fbpriceUpdateRef.current.value = null;
        hbpriceUpdateRef.current.value = null;
        bbpriceUpdateRef.current.value = null;
        ropriceUpdateRef.current.value = null;
        taxIdUpdateRef.current.value = null;
        smokingUpdateRef.current.value = null;

        await mutate(APIURL);
        toast.dismiss();
        toast.success(res.data.message);
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);

      toast.dismiss();
      toast.error(message);
    }
  };

  return (
    <Page className="px-8 py-6">
      <div className="flex items-center gap-6">
        <h3 className="text-3xl font-light">Rooms</h3>
        <button
          onClick={() => document.getElementById("modal-add").showModal()}
          className="rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-2 py-1 flex items-center gap-1"
        >
          <IconPlus size={22} stroke={iconStroke} /> New
        </button>
      </div>

      <div className="mt-8 w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {rooms?.map((room, index) => {
          const {
            id,
            room_no,
            room_category,
            bed_count,
            max_person,
            description,
            full_board,
            half_board,
            bb,
            room_only,
            tax_id,
            smoking_facility,
          } = room;

          return (
            <div
              key={id}
              className="border px-4 py-3 rounded-2xl flex flex-col gap-4 text-sm"
            >
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
                  <IconDoor />
                </div>
                <div>
                  <p>
                    {room_no} - {room_category}
                  </p>

                  <p className="text-gray-400">Bed Count: {bed_count}</p>
                  <div className="flex gap-2">
                    <p className="text-gray-400 text-xs">
                      FB Price : {full_board}
                    </p>
                    <p className="text-gray-400 text-xs">
                      HB Price : {half_board}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <p className="text-gray-400 text-xs">BB Price : {bb}</p>
                    <p className="text-gray-400 text-xs">
                      RO Price : {room_only}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0">
                  <button
                    onClick={() => {
                      btnShowUpdate(
                        id,
                        room_no,
                        room_category,
                        bed_count,
                        max_person,
                        description,
                        full_board,
                        half_board,
                        bb,
                        room_only,
                        tax_id,
                        smoking_facility
                      );
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition active:scale-95"
                  >
                    <IconPencil stroke={iconStroke} />
                  </button>
                  <button
                    onClick={() => {
                      btnDelete(id);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-gray-100 transition active:scale-95"
                  >
                    <IconTrash stroke={iconStroke} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <dialog id="modal-add" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Add New Room</h3>

          <div className="mt-4">
            <label htmlFor="title" className="mb-1 block text-gray-500 text-sm">
              Room No
              <span className="text-xs text-gray-400">- (Required)</span>
            </label>
            <input
              ref={roomNameRef}
              type="text"
              name="roomNo"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Room No"
            />
          </div>

          <div className="flex gap-4 w-full my-4">
            <div className="flex-1">
              <label
                htmlFor="roomCategory"
                className="mb-1 block text-gray-500 text-sm"
              >
                Room Category
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>

              <select
                name="roomCategory"
                id="roomCategory"
                placeholder="Select Room Category"
                ref={roomCategoryRef}
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              >
                <option value="" hidden>
                  Select Room Category
                </option>
                <option value="SINGLE_ROOM">SINGLE_ROOM</option>
                <option value="STANDARD_DOUBLE_ROOM">
                  STANDARD_DOUBLE_ROOM
                </option>
                <option value="STANDARD_TWIN_ROOM">STANDARD_TWIN_ROOM</option>
                <option value="DELUXE_DOUBLE_ROOM">DELUXE_DOUBLE_ROOM</option>
                <option value="STUDIO_ROOM_OR_APARTMENT">
                  STUDIO_ROOM_OR_APARTMENT
                </option>
                <option value="JUNIOR_SUITE">JUNIOR_SUITE</option>
                <option value="EXECUTIVE_SUITE">EXECUTIVE_SUITE</option>
                <option value="PRESIDENTIAL_SUITE">PRESIDENTIAL_SUITE</option>
              </select>
            </div>
            <div className="flex-1">
              <label
                htmlFor="bedcount"
                className="mb-1 block text-gray-500 text-sm"
              >
                Bed Count
              </label>
              <input
                ref={bedCountRef}
                type="number"
                min={0}
                name="bedcount"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Bed Count"
              />
            </div>
          </div>

          <div className="flex gap-4 w-full my-4">
            <div className="flex-1">
              <label
                htmlFor="maxperson"
                className="mb-1 block text-gray-500 text-sm"
              >
                Max-Person Count
              </label>
              <input
                ref={maxPersonCountRef}
                type="number"
                min={0}
                name="maxperson"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Max Person Count"
              />
            </div>

            <div className="flex-1">
              <label htmlFor="tax" className="mb-1 block text-gray-500 text-sm">
                Tax
              </label>
              <select
                ref={taxIdRef}
                name="tax"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Tax"
              >
                <option value="">None</option>
                {taxes?.map((tax, index) => {
                  return (
                    <option value={tax.id} key={tax.id}>
                      {tax.title} - {tax.rate}% ({tax.type})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="flex gap-4 w-full my-4">
            <div className="flex-1">
              <label
                htmlFor="fbprice"
                className="mb-1 block text-gray-500 text-sm"
              >
                Full Board Price
              </label>
              <input
                ref={fbpriceRef}
                type="number"
                min={0}
                name="fbprice"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Price"
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="hbprice"
                className="mb-1 block text-gray-500 text-sm"
              >
                Half Board Price
              </label>
              <input
                ref={hbpriceRef}
                type="number"
                min={0}
                name="hbprice"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Price"
              />
            </div>
          </div>
          <div className="flex gap-4 w-full my-4">
            <div className="flex-1">
              <label
                htmlFor="bbprice"
                className="mb-1 block text-gray-500 text-sm"
              >
                BB Price
              </label>
              <input
                ref={bbpriceRef}
                type="number"
                min={0}
                name="bbprice"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Price"
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="roprice"
                className="mb-1 block text-gray-500 text-sm"
              >
                Room Only Price
              </label>
              <input
                ref={ropriceRef}
                type="number"
                min={0}
                name="roprice"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Price"
              />
            </div>
          </div>
          <div className="flex-1">
            <label
              htmlFor="smoking"
              className="mb-1 block text-gray-500 text-sm"
            >
              Smoking Facility
            </label>
            <select
              ref={smokingRef}
              name="smoking"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Select Tax"
            >
              <option value="">None</option>
              <option value="smoking">Smoking</option>
              <option value="non-smoking">None-Smoking</option>
            </select>
          </div>
          <div className="flex-1 mt-4">
            <label
              htmlFor="description"
              className="mb-1 block text-gray-500 text-sm"
            >
              Description
            </label>
            <textarea
              ref={descriptionRef}
              type="number"
              min={0}
              name="description"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Description"
            />
          </div>

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
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>

      <dialog id="modal-update" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Update Table</h3>

          <div className="mt-4">
            <input type="hidden" ref={tableIdRef} />
            <label htmlFor="title" className="mb-1 block text-gray-500 text-sm">
              Room No
              <span className="text-xs text-gray-400">- (Required)</span>
            </label>
            <input
              ref={roomNameUpdateRef}
              type="number"
              name="roomNo"
              disabled
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Room No"
            />
          </div>

          <div className="flex gap-4 w-full my-4">
            <div className="flex-1">
              <label
                htmlFor="roomCategory"
                className="mb-1 block text-gray-500 text-sm"
              >
                Room Category
                <span className="text-xs text-gray-400">- (Required)</span>
              </label>

              <select
                name="roomCategory"
                id="roomCategory"
                placeholder="Select Room Category"
                ref={roomCategoryUpdateRef}
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              >
                <option value="" hidden>
                  Select Room Category
                </option>
                <option value="SINGLE_ROOM">SINGLE_ROOM</option>
                <option value="STANDARD_DOUBLE_ROOM">
                  STANDARD_DOUBLE_ROOM
                </option>
                <option value="STANDARD_TWIN_ROOM">STANDARD_TWIN_ROOM</option>
                <option value="DELUXE_DOUBLE_ROOM">DELUXE_DOUBLE_ROOM</option>
                <option value="STUDIO_ROOM_OR_APARTMENT">
                  STUDIO_ROOM_OR_APARTMENT
                </option>
                <option value="JUNIOR_SUITE">JUNIOR_SUITE</option>
                <option value="EXECUTIVE_SUITE">EXECUTIVE_SUITE</option>
                <option value="PRESIDENTIAL_SUITE">PRESIDENTIAL_SUITE</option>
              </select>
            </div>
            <div className="flex-1">
              <label
                htmlFor="bedcount"
                className="mb-1 block text-gray-500 text-sm"
              >
                Bed Count
              </label>
              <input
                ref={bedCountUpdateRef}
                type="number"
                min={0}
                name="bedcount"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Bed Count"
              />
            </div>
          </div>
          <div className="flex gap-4 w-full my-4">
            <div className="flex-1">
              <label
                htmlFor="maxperson"
                className="mb-1 block text-gray-500 text-sm"
              >
                Max-Person Count
              </label>
              <input
                ref={maxPersonCountUpdateRef}
                type="number"
                min={0}
                name="maxperson"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Max Person Count"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="taxId"
                className="mb-1 block text-gray-500 text-sm"
              >
                Tax
              </label>
              <select
                name="taxId"
                ref={taxIdUpdateRef}
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              >
                <option value="">None</option>
                {taxes?.map((tax) => (
                  <option key={tax.id} value={tax.id}>
                    {tax.title} - {tax.rate}% ({tax.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4 w-full my-4">
            <div className="flex-1">
              <label
                htmlFor="fbprice"
                className="mb-1 block text-gray-500 text-sm"
              >
                Full Board Price
              </label>
              <input
                ref={fbpriceUpdateRef}
                type="number"
                min={0}
                name="fbprice"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Price"
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="hbprice"
                className="mb-1 block text-gray-500 text-sm"
              >
                Half Board Price
              </label>
              <input
                ref={hbpriceUpdateRef}
                type="number"
                min={0}
                name="hbprice"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Price"
              />
            </div>
          </div>
          <div className="flex gap-4 w-full my-4">
            <div className="flex-1">
              <label
                htmlFor="bbprice"
                className="mb-1 block text-gray-500 text-sm"
              >
                BB Price
              </label>
              <input
                ref={bbpriceUpdateRef}
                type="number"
                min={0}
                name="bbprice"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Price"
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="roprice"
                className="mb-1 block text-gray-500 text-sm"
              >
                Room Only Price
              </label>
              <input
                ref={ropriceUpdateRef}
                type="number"
                min={0}
                name="roprice"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Price"
              />
            </div>
          </div>
          <div className="flex-1">
            <label
              htmlFor="smoking"
              className="mb-1 block text-gray-500 text-sm"
            >
              Smoking Facility
            </label>
            <select
              ref={smokingUpdateRef}
              name="smoking"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
            >
              <option value="">None</option>
              <option value="smoking">Smoking</option>
              <option value="non-smoking">Non-Smoking</option>
            </select>
          </div>
          <div className="flex-1 mt-4">
            <label
              htmlFor="description"
              className="mb-1 block text-gray-500 text-sm"
            >
              Description
            </label>
            <textarea
              ref={descriptionUpdateRef}
              type="number"
              min={0}
              name="description"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Description"
            />
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500">
                Close
              </button>
              <button
                onClick={() => {
                  btnUpdate();
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </Page>
  );
}
