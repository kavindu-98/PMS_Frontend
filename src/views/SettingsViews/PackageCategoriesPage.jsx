/** @format */

import React, { useRef } from "react";
import Page from "../../components/Page";
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { iconStroke } from "../../config/config";
import {
  addOptionCategory,
  useOptionCategories,
  deleteOptionCategory,
  updateOptionCategory,
} from "../../controllers/settings.controller";
import toast from "react-hot-toast";
import { mutate } from "swr";

export default function PackageCategoriesPage() {
  const categoryTitleRef = useRef();

  const categoryIdRef = useRef();
  const categoryTitleUpdateRef = useRef();

  const { APIURL, data: categories, error, isLoading } = useOptionCategories();

  if (isLoading) {
    return <Page className="px-8 py-6">Please wait...</Page>;
  }

  if (error) {
    console.error(error);
    return <Page className="px-8 py-6">Error loading data, Try Later!</Page>;
  }

  async function btnAdd() {
    const title = categoryTitleRef.current.value;

    if (!title) {
      toast.error("Please provide Category Name!");
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await addOptionCategory(title);

      if (res.status == 200) {
        categoryTitleRef.current.value = "";
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

  const btnShowUpdate = async (id, title) => {
    categoryIdRef.current.value = id;
    categoryTitleUpdateRef.current.value = title;
    document.getElementById("modal-update").showModal();
  };

  const btnUpdate = async () => {
    const id = categoryIdRef.current.value;
    const title = categoryTitleUpdateRef.current.value;

    if (!title) {
      toast.error("Please provide title!");
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await updateOptionCategory(id, title);

      if (res.status == 200) {
        categoryIdRef.current.value = null;
        categoryTitleUpdateRef.current.value = null;

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

  const btnDelete = async (id) => {
    const isConfirm = window.confirm(
      "Are you sure! This process is irreversible!"
    );

    if (!isConfirm) {
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await deleteOptionCategory(id);

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

  return (
    <Page className="px-8 py-6">
      <div className="flex items-center gap-6">
        <h3 className="text-3xl font-light">Package Categories</h3>
        <button
          onClick={() => document.getElementById("modal-add").showModal()}
          className="flex items-center gap-1 px-2 py-1 text-gray-500 transition border rounded-lg bg-gray-50 hover:bg-gray-100 active:scale-95 hover:shadow-lg"
        >
          <IconPlus size={22} stroke={iconStroke} /> New
        </button>
      </div>

      <div className="w-full mt-8">
        <table className="w-full overflow-x-auto border">
          <thead>
            <tr>
              <th className="w-20 px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start">
                #
              </th>
              <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start w-96">
                Category Title
              </th>

              <th className="px-3 py-2 font-medium text-gray-500 bg-gray-100 text-start w-28">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {categories?.map((category, index) => {
              const { id, category_name } = category;

              return (
                <tr key={index}>
                  <td className="px-3 py-2 text-start">{index + 1}</td>
                  <td className="px-3 py-2 text-start">{category_name}</td>
                  <td className="flex items-center gap-2 px-3 py-2 text-start">
                    <button
                      onClick={() => {
                        btnShowUpdate(id, category_name);
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <dialog id="modal-add" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Add New Package Category</h3>

          <div className="my-4">
            <label htmlFor="title" className="block mb-1 text-sm text-gray-500">
              Package Category Title
            </label>
            <input
              ref={categoryTitleRef}
              type="text"
              name="title"
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Category Title..."
            />
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
          <h3 className="text-lg font-bold">Update Package Category</h3>

          <div className="my-4">
            <input type="hidden" ref={categoryIdRef} />
            <label htmlFor="title" className="block mb-1 text-sm text-gray-500">
              Package Category Title
            </label>
            <input
              ref={categoryTitleUpdateRef}
              type="text"
              name="title"
              className="w-full px-4 py-2 text-sm border rounded-lg bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Category Title..."
            />
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="px-4 py-3 text-gray-500 transition bg-gray-200 rounded-lg hover:bg-gray-200 active:scale-95 hover:shadow-lg">
                Close
              </button>
              <button
                onClick={() => {
                  btnUpdate();
                }}
                className="px-4 py-3 ml-3 text-white transition rounded-lg hover:bg-green-800 active:scale-95 hover:shadow-lg bg-restro-green"
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
