/** @format */

import React, { useRef, useEffect, useState } from "react";
import Page from "../../components/Page";
import {
  IconCarrot,
  IconSoup,
  IconPencil,
  IconBaguette,
  IconPlus,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconX,
} from "@tabler/icons-react";
import { iconStroke } from "../../config/config";
import {
  useIngredientsCategories,
  useCategories,
  useTaxes,
} from "../../controllers/settings.controller";
import toast from "react-hot-toast";
import { mutate } from "swr";
import { clsx } from "clsx";
import { Link, useNavigate } from "react-router-dom";
import {
  addIngredientsItem,
  deleteIngredientsItem,
  useIngredientsItems,
} from "../../controllers/ingredient_item.controller";
import {
  addMenuItem,
  deleteMenuItem,
  useMenuItems,
  useMenuItemRecipes,
} from "../../controllers/menu_item.controller";

export default function addIngredientsItemSettingsPage() {
  const navigate = useNavigate();
  const ingredientRef = useRef();
  const stockAlertRef = useRef();
  const productUnitRef = useRef();
  const ingredientPurUnitRef = useRef();
  const ingredientSaleUnitRef = useRef();
  const [currentPage, setCurrentPage] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const [state, setState] = useState({
    spage: 1,
    search: "",
  });

  // const {
  //   APIURL: APIURLCategories,
  //   data: categories,
  //   error: errorCategories,
  //   isLoading: isLoadingCategories,
  // } = useIngredientsCategories();

  const {
    APIURL: APIURLCategories,
    data: categories,
    error: errorCategories,
    isLoading: isLoadingCategories,
  } = useCategories();

  useEffect(() => {
    if (categories?.length > 0) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories]);

  const {
    APIURL: APIURLTaxes,
    data: taxes,
    error: errorTaxes,
    isLoading: isLoadingTaxes,
  } = useTaxes();

  // const { APIURL, data: menuItems, error, isLoading } = useMenuItems();
  const {
    APIURL,
    data: menuItems,
    error,
    isLoading,
  } = useMenuItemRecipes(selectedCategory);
  // const { APIURL, data: menuItems, error, isLoading } = useMenuItems();

  console.log("selectedCategory", selectedCategory);

  // pagination
  const btnPaginationFirstPage = () => {
    setState({
      ...state,
      spage: 1,
    });
  };
  const btnPaginationLastPage = () => {
    setState({
      ...state,
      spage: totalPages,
    });
  };
  const btnPaginationNextPage = () => {
    if (currentPage == totalPages) {
      return;
    }
    setState({
      ...state,
      spage: state.spage + 1,
    });
  };
  const btnPaginationPreviousPage = () => {
    if (currentPage == 1) {
      return;
    }
    setState({
      ...state,
      spage: state.spage - 1,
    });
  };
  // pagination

  if (isLoadingCategories) {
    return <Page>Please wait...</Page>;
  }

  if (errorCategories) {
    return <Page>Error loading details! Please Try Later!</Page>;
  }

  if (isLoadingTaxes) {
    return <Page>Please wait...</Page>;
  }

  if (errorTaxes) {
    return <Page>Error loading details! Please Try Later!</Page>;
  }

  if (isLoading) {
    return <Page>Please wait...</Page>;
  }

  if (error) {
    return <Page>Error loading details! Please Try Later!</Page>;
  }

  async function btnAdd() {
    const ingredientName = ingredientRef.current.value;
    const stockAlert = stockAlertRef.current.value;
    const productUnit = productUnitRef.current.value || null;
    const ingredientSaleUnit = ingredientSaleUnitRef.current.value || null;
    const ingredientPurUnit = ingredientPurUnitRef.current.value || null;

    if (!ingredientName) {
      toast.error("Please enter ingredientName!");
      return;
    }

    if (stockAlert < 0) {
      toast.error("Please provide valid Stock Alert!");
      return;
    }

    try {
      toast.loading("Please wait...");
      const res = await addMenuItem(
        ingredientName,
        stockAlert,
        productUnit,
        ingredientSaleUnit,
        ingredientPurUnit
      );

      if (res.status == 200) {
        ingredientRef.current.value = null;
        stockAlertRef.current.value = null;
        productUnitRef.current.value = null;
        ingredientSaleUnitRef.current.value = null;
        ingredientPurUnitRef.current.value = null;

        await mutate(APIURL);
        toast.dismiss();
        toast.success(res.data.message);
      }
    } catch (error) {
      const message = error.response.data.message || "Something went wrong!";
      console.error(error);
      toast.dismiss();
      toast.error(message);
    }
  }

  // const btnShowAddRecipe = () => {
  //   navigate(`/dashboard/settings/add-recipes/add`);
  // };
  const btnShowUpdate = (id) => {
    navigate(`/dashboard/settings/add-recipes/update/${id}`);
  };

  return (
    <Page className="px-8 py-6">
      <div className="flex md:items-center flex-col md:flex-row gap-2">
        <h3 className="text-3xl font-light mr-6">Add Recipes</h3>
        {/* <button
          onClick={() => {
            btnShowAddRecipe();
          }}
          className="rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-2 py-1 flex items-center gap-1 mr-4 w-fit"
        >
          <IconPlus size={22} stroke={iconStroke} />
          Create New
        </button> */}
        {/* <Link
          to="categories"
          className="w-fit rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-3 py-1"
        >
          Ingredients Categories
        </Link> */}
      </div>

      {/* categories */}
      <div className="p-2 w-full  overflow-x-auto mx-auto mt-4 flex gap-2">
        {categories?.length > 0 ? (
          categories.map((category, index) => {
            const { id, title } = category;
            return (
              <div key={index} className="min-w-fit">
                <input
                  type="radio"
                  name="category"
                  id={id}
                  value={id}
                  className="peer hidden"
                  onChange={handleCategoryChange}
                  // checked={selectedCategory === id}
                />
                <label
                  htmlFor={id}
                  className="text-xs min-w-fit flex items-center cursor-pointer rounded-full px-4 py-3 bg-transparent border hover:bg-gray-50 active:scale-95 transition text-gray-500 peer-checked:bg-gray-200"
                >
                  <p>{title}</p>
                </label>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 text-sm">No categories.</p>
        )}
      </div>
      {/* categories */}

      <div className="mt-8 w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {menuItems?.length > 0 ? (
          menuItems.map((menuItem) => {
            const {
              id,
              title,
              menu_item_title,
              category_title,
              menu_recipe_items,
              addons,
              variants,
            } = menuItem;

            return (
              <div
                key={id}
                className="border px-4 py-3 rounded-2xl flex flex-wrap items-center gap-2 text-sm"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
                  <IconSoup />
                </div>
                <div className="flex-1">
                  <p>{title}</p>
                  <p className="text-gray-400 text-xs">{category_title}</p>
                  {variants.length > 0 && (
                    <p className="text-gray-400 text-xs">
                      {variants.length} Variants
                    </p>
                  )}
                </div>
                <div className="flex gap-0">
                  <button
                    onClick={() => {
                      btnShowUpdate(id);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition active:scale-95"
                  >
                    <IconPencil stroke={iconStroke} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 text-sm">
            No recipes available for this category.
          </p>
        )}
      </div>

      {/* pagination */}
      <div className="flex justify-end mt-8">
        <div className="join">
          <button
            onClick={btnPaginationFirstPage}
            className={clsx("join-item btn btn-sm bg-gray-100 text-gray-500", {
              "btn-disabled": currentPage == 1,
            })}
          >
            <IconChevronsLeft stroke={iconStroke} />
          </button>
          <button
            onClick={btnPaginationPreviousPage}
            className={clsx("join-item btn btn-sm bg-gray-100 text-gray-500", {
              "btn-disabled": currentPage == 1,
            })}
          >
            <IconChevronLeft stroke={iconStroke} />
          </button>
          <button className="join-item btn btn-sm bg-gray-100 text-gray-500">
            Page {currentPage}
          </button>
          <button
            onClick={btnPaginationNextPage}
            className={clsx("join-item btn btn-sm bg-gray-100 text-gray-500", {
              "btn-disabled": currentPage == totalPages,
            })}
          >
            <IconChevronRight stroke={iconStroke} />
          </button>
          <button
            onClick={btnPaginationLastPage}
            className={clsx("join-item btn btn-sm bg-gray-100 text-gray-500", {
              "btn-disabled": currentPage == totalPages,
            })}
          >
            <IconChevronsRight stroke={iconStroke} />
          </button>
        </div>
      </div>
      <div className="text-end mt-4">
        <p>{/* Showing {ingredients.length} of {totalItems} */}</p>
      </div>
      {/* pagination */}

      {/* add dialog */}
      <dialog id="modal-add" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Add New Ingredients</h3>

          <div className="mt-4">
            <label
              htmlFor="ingredientName"
              className="mb-1 block text-gray-500 text-sm"
            >
              Ingredient Name
            </label>
            <input
              ref={ingredientRef}
              type="text"
              name="ingredientName"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Item Ingredient Name"
            />
          </div>

          <div className="flex gap-4 w-full my-4">
            <div className="flex-1">
              <label
                htmlFor="stockAlert"
                className="mb-1 block text-gray-500 text-sm"
              >
                Stock Alert
              </label>
              <input
                ref={stockAlertRef}
                type="number"
                name="stockAlert"
                min={0}
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Enter Item Stock Alert"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="nprice"
                className="mb-1 block text-gray-500 text-sm"
              >
                Ingredient Unit
              </label>
              <select
                ref={productUnitRef}
                name="category"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Product Unit"
              >
                <option value="">None</option>
                <option value="kg">kg</option>
                <option value="pcs">pcs</option>
                <option value="l">l</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 w-full my-4">
            <div className="flex-1">
              <label
                htmlFor="ingredientSaleUnit"
                className="mb-1 block text-gray-500 text-sm"
              >
                Ingredient Sale Unit
              </label>
              <select
                ref={ingredientSaleUnitRef}
                name="ingredientSaleUnit"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Ingredient Sale Unit"
              >
                <option value="">None</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="pcs">pcs</option>
                <option value="l">l</option>
                <option value="ml">ml</option>
              </select>
            </div>
            <div className="flex-1">
              <label
                htmlFor="ingredientPurUnit"
                className="mb-1 block text-gray-500 text-sm"
              >
                Ingredient Purchase Unit
              </label>
              <select
                ref={ingredientPurUnitRef}
                name="ingredientPurUnit"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Ingredient Purchase Unit"
              >
                <option value="">None</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="pcs">pcs</option>
                <option value="l">l</option>
                <option value="ml">ml</option>
              </select>
            </div>
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
      {/* add dialog */}
    </Page>
  );
}
