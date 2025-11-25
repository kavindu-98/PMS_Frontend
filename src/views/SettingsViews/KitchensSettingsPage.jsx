/** @format */

import React, { useRef, useState } from "react";
import Page from "../../components/Page";
import {
  IconPencil,
  IconPlus,
  IconTrash,
  IconCirclePlus,
  IconChefHat,
} from "@tabler/icons-react";
import { iconStroke } from "../../config/config";
import {
  addKitchen,
  deleteKitchen,
  updateKitchen,
  useKitchens,
} from "../../controllers/settings.controller";
import toast from "react-hot-toast";
import { mutate } from "swr";

export default function KitchensSettingsPage() {
  const kitchenNameRef = useRef();
  const locationRef = useRef();
  const kitchenNameUpdateRef = useRef();
  const locationUpdateRef = useRef();

  const [kitchenId, setKitchenId] = useState(null); // Use state for plateId

  // const { APIURL, data: rooms, error, isLoading } = useRooms();
  const { APIURL, data: kitchens, error, isLoading } = useKitchens();

  const btnDelete = async (id) => {
    const isConfirm = window.confirm(
      "Are you sure! This process is irreversible!"
    );

    if (!isConfirm) {
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await deleteKitchen(id);

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

  async function btnAdd() {
    const kitchenName = kitchenNameRef.current.value;
    const location = locationRef.current.value;

    if (!kitchenName) {
      toast.error("Please provide Name!");
      return;
    }
    if (!location) {
      toast.error("Please provide location");
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await addKitchen(kitchenName, location); // Pass FormData to the API

      if (res.status === 200) {
        // Reset fields after successful submission
        kitchenNameRef.current.value = "";
        locationRef.current.value = "";
        await mutate(APIURL);
        toast.dismiss();
        toast.success(res.data.message);

        // Close modal after successful update
        const modal = document.getElementById("modal-add");
        if (modal) {
          modal.close(); // Close modal
        }
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);

      toast.dismiss();
      toast.error(message);
    }
  }

  const btnShowUpdate = async (id, kitchenName, location) => {
    setKitchenId(id);

    // Populate fields with existing values
    kitchenNameUpdateRef.current.value = kitchenName;
    locationUpdateRef.current.value = location;

    document.getElementById("modal-update").showModal();
  };

  const btnUpdate = async () => {
    const id = kitchenId;
    const kitchenName = kitchenNameUpdateRef.current.value;
    const location = locationUpdateRef.current.value;

    if (!kitchenName || !location) {
      toast.error("Please fill all required fields.");
      return;
    }

    try {
      toast.loading("Updating kitchen...");
      const res = await updateKitchen(id, kitchenName, location);

      if (res.status === 200) {
        setKitchenId(null);
        kitchenNameUpdateRef.current.value = "";
        locationUpdateRef.current.value = "";

        await mutate(APIURL);
        toast.dismiss();
        toast.success(res.data.message);

        document.getElementById("modal-update").close();
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      toast.dismiss();
      toast.error(message);
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
      <div className="flex items-center gap-6">
        <h3 className="text-3xl font-light">Kitchens</h3>
        <button
          onClick={() => document.getElementById("modal-add").showModal()}
          className="flex items-center gap-1 px-2 py-1 text-gray-500 transition border rounded-lg bg-gray-50 hover:bg-gray-100 active:scale-95 hover:shadow-lg"
        >
          <IconPlus size={22} stroke={iconStroke} /> New
        </button>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 mt-8 lg:grid-cols-2 xl:grid-cols-3">
        {Array.isArray(kitchens) && kitchens?.length > 0 ? (
          kitchens.map((kitchen, index) => {
            const { id, kitchen_name, location } = kitchen;

            return (
              <div
                key={id}
                className="flex flex-col gap-4 px-4 py-3 text-sm border rounded-2xl"
              >
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-12 h-12 text-gray-400 bg-gray-100 rounded-full">
                    <IconChefHat />
                  </div>
                  <div>
                    <p>{kitchen_name}</p>

                    <p className="text-gray-400">Location: {location}</p>
                  </div>
                  <div className="flex gap-0">
                    <button
                      onClick={() => {
                        btnShowUpdate(id, kitchen_name, location);
                      }}
                      className="flex items-center justify-center w-8 h-8 text-gray-500 transition rounded-full hover:bg-gray-100 active:scale-95"
                    >
                      <IconPencil stroke={iconStroke} />
                    </button>
                    <button
                      onClick={() => {
                        btnDelete(id);
                      }}
                      className="flex items-center justify-center w-8 h-8 text-red-500 transition rounded-full hover:bg-gray-100 active:scale-95"
                    >
                      <IconTrash stroke={iconStroke} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 text-center py-4">
            No Kitchens available.
          </p>
        )}
      </div>

      <dialog id="modal-add" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Add New Kitchen</h3>

          <div className="mt-4">
            <label
              htmlFor="kitchenName"
              className="block mb-1 text-sm text-gray-500"
            >
              Kitchen Name
              <span className="text-xs text-gray-400">- (Required)</span>
            </label>
            <input
              ref={kitchenNameRef}
              type="text"
              name="kitchenName"
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Kitchen Name"
            />
          </div>

          <div className="flex w-full gap-4 my-4">
            <div className="flex-1">
              <label
                htmlFor="location"
                className="block mb-1 text-sm text-gray-500"
              >
                Location
              </label>
              <input
                ref={locationRef}
                type="text"
                name="location"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Location"
              />
            </div>
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg">
                Close
              </button>
              <button
                onClick={() => {
                  btnAdd();
                }}
                className="px-4 py-3 ml-3 text-white transition rounded-lg hover:bg-green-800 active:scale-95 hover:shadow-lg bg-restro-green"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>
      <dialog id="modal-update" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Update Kitchen</h3>
          <div className="mt-4">
            <label
              htmlFor="kitchenName"
              className="block mb-1 text-sm text-gray-500"
            >
              Kitchen Name{" "}
              <span className="text-xs text-gray-400">- (Required)</span>
            </label>
            <input
              ref={kitchenNameUpdateRef}
              type="text"
              name="kitchenName"
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Kitchen Name"
            />
          </div>

          <div className="flex w-full gap-4 my-4">
            <div className="flex-1">
              <label
                htmlFor="location"
                className="block mb-1 text-sm text-gray-500"
              >
                Location
              </label>
              <input
                ref={locationUpdateRef}
                type="text"
                name="location"
                className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Location"
              />
            </div>
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg">
                Close
              </button>
              <button
                type="button"
                onClick={btnUpdate}
                className="px-4 py-3 ml-3 text-white transition rounded-lg hover:bg-green-800 active:scale-95 hover:shadow-lg bg-restro-green"
              >
                Update
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </Page>
  );
}
