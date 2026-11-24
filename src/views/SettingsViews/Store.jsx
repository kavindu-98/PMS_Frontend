/** @format */

import React, { useEffect } from "react";
import Page from "../../components/Page";
import {
  IconPencil,
  IconPlus,
  IconTrash,
  IconArmchair2,
  IconQrcode,
  IconBuildingWarehouse,
} from "@tabler/icons-react";
import { iconStroke } from "../../config/config";
import {
  useStores,
  addStores,
  updateStores,
  deleteStores,
} from "../../controllers/store.controller";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { mutate } from "swr";
const Store = () => {
  const {
    APIURL,
    data: stores,
    error: errorRooms,
    isLoading: isLoadingRooms,
  } = useStores();

  const [formData, setFormData] = useState({
    storeName: null,
    storeLocation: null,
    isConsumableStore: false,
    storeId: null,
  });

  const storeIdRef = useRef();
  const storeNameRef = useRef();
  const storeLocationRef = useRef();
  const isConsumableRef = useRef();
  const isHousekeepingRef = useRef();

  const storeNameUpdateRef = useRef();
  const storeLocationUpdateRef = useRef();
  const isConsumableUpdateRef = useRef();
  const isHousekeepingUpdateRef = useRef();

  const clearFields = () => {
    storeNameRef.current.value = null;
    storeLocationRef.current.value = null;
    isConsumableRef.current.checked = null;
    isHousekeepingRef.current.checked = null;
  };

  const addStoreData = async () => {
    const storeName = storeNameRef.current.value;
    const storeLocation = storeLocationRef.current.value;
    const isConsumableStore = isConsumableRef.current.checked;
    const isHouseKeeping = isHousekeepingRef.current.checked;

    if (!storeName) {
      toast.error("Please Enter Store Name!");
      return;
    }
    if (!storeLocation) {
      toast.error("Please Enter Store Location!");
      return;
    }
    try {
      toast.loading("Please wait...");
      const res = await addStores({
        storeName,
        storeLocation,
        isConsumableStore,
        isHouseKeeping,
      });
      if (res.status === 200) {
        clearFields();
        await mutate(APIURL);
        toast.dismiss();
        toast.success(res.data.message);
        document.getElementById("modal-add").close();
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);

      toast.dismiss();
      toast.error(message);
    }
  };

  const btnShowUpdate = (
    id,
    storeName,
    storeLocation,
    isConsumableStore,
    is_house_keeping
  ) => {
    storeIdRef.current.value = id;
    storeNameUpdateRef.current.value = storeName;
    storeLocationUpdateRef.current.value = storeLocation;
    isConsumableUpdateRef.current.checked = isConsumableStore;
    isHousekeepingUpdateRef.current.checked = is_house_keeping;
    document.getElementById("modal-update").showModal();
  };

  const UpdateStoreData = async () => {
    const storeId = storeIdRef.current.value;
    const storeName = storeNameUpdateRef.current.value;
    const storeLocation = storeLocationUpdateRef.current.value;
    const isConsumableStore = isConsumableUpdateRef.current.checked;
    const isHouseKeeping = isHousekeepingUpdateRef.current.checked;

    if (!storeName) {
      toast.error("Please Enter Store Name!");
      return;
    }
    if (!storeLocation) {
      toast.error("Please Enter Store Location!");
      return;
    }
    try {
      toast.loading("Please wait...");
      const res = await updateStores({
        storeId,
        storeName,
        storeLocation,
        isConsumableStore,
        isHouseKeeping,
      });
      if (res.status == 200 || res.status == 201) {
        await mutate(APIURL);
        clearFields();
        toast.dismiss();
        toast.success(res.data.message);
        document.getElementById("modal-update").close();
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);
      toast.dismiss();
      toast.error(message);
    }
  };

  const btnDelete = async (id) => {
    if (!id) {
      toast.error("Invalid store ID. Please try again.");
      return;
    }

    const isConfirm = window.confirm(
      "Are you sure? This process is irreversible!"
    );

    if (!isConfirm) {
      return;
    }

    try {
      toast.dismiss();
      toast.loading("Please wait...");

      const res = await deleteStores({ id }); // Pass ID as an object

      if (res?.status === 200) {
        toast.dismiss();
        toast.success(res.data?.message || "Store deleted successfully.");

        await mutate(APIURL);
      } else {
        throw new Error("Failed to delete store.");
      }
    } catch (error) {
      console.error("Error deleting store:", error);
      toast.dismiss();
      toast.error(error?.response?.data?.message || "Something went wrong!");
    }
  };

  return (
    <Page className="px-8 py-6">
      <div className="flex items-center gap-6">
        <h3 className="text-3xl font-light">Stores</h3>
        <button
          onClick={() => document.getElementById("modal-add").showModal()}
          className="rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-2 py-1 flex items-center gap-1"
        >
          <IconPlus size={22} stroke={iconStroke} /> New
        </button>
      </div>

      <div className="mt-8 w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.isArray(stores) && stores?.length > 0 ? (
          stores.map((store, index) => {
            const {
              id,
              storeName,
              storeLocation,
              isConsumableStore,
              is_house_keeping,
            } = store;

            return (
              <div
                key={id}
                className="border px-4 py-3 rounded-2xl flex flex-wrap items-center gap-2 text-sm"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
                  <IconBuildingWarehouse />
                </div>
                <div className="flex-1">
                  <p>{storeName}</p>
                  <p className="text-gray-400 text-xs">{storeLocation}</p>
                  <p className="text-gray-400 text-xs">
                    Is Consumable: {isConsumableStore ? "Yes" : "No"}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Is Housekeeping: {is_house_keeping ? "Yes" : "No"}
                  </p>
                </div>
                <div className="flex gap-0">
                  <button
                    onClick={() => {
                      btnShowUpdate(
                        id,
                        storeName,
                        storeLocation,
                        isConsumableStore,
                        is_house_keeping
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
            );
          })
        ) : (
          <p className="text-gray-500 text-center py-4">No stores available.</p>
        )}
      </div>

      {/* store Add */}
      <dialog id="modal-add" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Add a Store</h3>

          <div className="flex flex-col gap-2 mb-4 mt-4">
            <label
              htmlFor="store_name"
              className="block mb-1 text-sm text-gray-500"
            >
              Store Name
            </label>
            <input
              ref={storeNameRef}
              type="text"
              name="store_name"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Store Name"
            />
          </div>

          <div className="flex flex-col gap-2 mb-4 mt-4">
            <label
              htmlFor="store_location"
              className="block mb-1 text-sm text-gray-500"
            >
              Store Location
            </label>
            <input
              ref={storeLocationRef}
              type="text"
              name="store_location"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Store Location"
            />
          </div>

          <div className="flex items-center gap-4 mt-4 mb-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isConsumable"
                className="checkbox"
                ref={isConsumableRef}
              />
              <label
                htmlFor="isConsumable"
                className="ml-2 mt-1 w-full flex items-center gap-2 "
              >
                Is Consumable ?
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isHousekeeping"
                className="checkbox"
                ref={isHousekeepingRef}
              />
              <label
                htmlFor="isHousekeeping"
                className="ml-2 mt-1 w-full flex items-center gap-2 "
              >
                Is Housekeeping Store ?
              </label>
            </div>
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button
                onClick={() => clearFields()}
                className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
              >
                Close
              </button>
              <button
                onClick={() => {
                  addStoreData();
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </dialog>

      {/* store Update */}
      <dialog id="modal-update" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Update Store</h3>

          <div className="flex flex-col gap-2 mb-4 mt-4">
            <input type="hidden" ref={storeIdRef} />
            <label
              htmlFor="store_name"
              className="block mb-1 text-sm text-gray-500"
            >
              Store Name
            </label>
            <input
              ref={storeNameUpdateRef}
              type="text"
              name="store_name"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Store Name"
            />
          </div>

          <div className="flex flex-col gap-2 mb-4 mt-4">
            <label
              htmlFor="store_location"
              className="block mb-1 text-sm text-gray-500"
            >
              Store Location
            </label>
            <input
              ref={storeLocationUpdateRef}
              type="text"
              name="store_location"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Store Location"
            />
          </div>

          <div className="flex items-center gap-4 mt-4 mb-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isConsumable"
                className="checkbox"
                ref={isConsumableUpdateRef}
              />
              <label
                htmlFor="isConsumable"
                className="ml-2 mt-1 w-full flex items-center gap-2 "
              >
                Is Consumable ?
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isHousekeeping"
                className="checkbox"
                ref={isHousekeepingUpdateRef}
              />
              <label
                htmlFor="isHousekeeping"
                className="ml-2 mt-1 w-full flex items-center gap-2 "
              >
                Is Housekeeping Store ?
              </label>
            </div>
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button
                onClick={() => clearFields()}
                className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
              >
                Close
              </button>
              <button
                onClick={() => {
                  UpdateStoreData();
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Update
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </Page>
  );
};

export default Store;
