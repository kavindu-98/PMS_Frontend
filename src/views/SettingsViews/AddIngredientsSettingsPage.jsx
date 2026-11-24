/** @format */

import React, { useRef, useState, useEffect } from "react";
import Page from "../../components/Page";
import {
  IconCarrot,
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
  useCategories,
  useIngredientsCategories,
  useTaxes,
} from "../../controllers/settings.controller";
import toast from "react-hot-toast";
import { mutate } from "swr";
import { Link, useNavigate } from "react-router-dom";
import {
  addIngredientsItem,
  deleteIngredientsItem,
  useIngredientsItems,
  updateIngredientsItem,
} from "../../controllers/ingredient_item.controller";
import { clsx } from "clsx";
// import {
//   addMenuItem,
//   deleteMenuItem,
//   useMenuItems,
// } from "../../controllers/menu_item.controller";

export default function addIngredientsItemSettingsPage() {
  const navigate = useNavigate();
  const ingredientRef = useRef();
  const filterHouseOrKitchenRef = useRef();
  const ingredientCategoryRef = useRef();
  const stockAlertRef = useRef();
  const isHousekeepingRef = useRef();
  const productUnitRef = useRef();
  const ingredientPurUnitRef = useRef();
  const ingredientSaleUnitRef = useRef();
  const ingredientUpdateRef = useRef();
  const ingredientCategoryUpdateRef = useRef();
  const stockAlertUpdateRef = useRef();
  const isHousekeepingUpdateRef = useRef();
  const productUnitUpdateRef = useRef();
  const ingredientPurUnitUpdateRef = useRef();
  const ingredientSaleUnitUpdateRef = useRef();
  const [refreshKey, setRefreshKey] = useState(0);
  const [saleUnitOptions, setSaleUnitOptions] = useState([]);
  const [purchaseUnitOptions, setPurchaseUnitOptions] = useState([]);
  const [selectIngredientId, setSelectIngredientId] = useState("");
  const [page, setPage] = useState(1);
  const [selectedSaleUnit, setSelectedSaleUnit] = useState("");
  const [selectedPurchaseUnit, setSelectedPurchaseUnit] = useState("");
  const [selectedSaleUnitUpdate, setSelectedSaleUnitUpdate] = useState("");
  const [selectedPurchaseUnitUpdate, setSelectedPurchaseUnitUpdate] = useState("");

  const searchRef = useRef();
  const [state, setState] = useState({
    spage: 1,
    search: "",
    isHousekeeping: "",
  });

  const unitOptionsMap = {
    kg: [
      { value: "kg", label: "kg" },
      { value: "g", label: "g" },
    ],
    pcs: [{ value: "pcs", label: "pcs" }],
    l: [
      { value: "l", label: "l" },
      { value: "ml", label: "ml" },
    ],
    default: [
      { value: "", label: "None" },
      { value: "kg", label: "kg" },
      { value: "g", label: "g" },
      { value: "pcs", label: "pcs" },
      { value: "l", label: "l" },
      { value: "ml", label: "ml" },
    ],
  };

  const handleProductUnitChange = () => {
    const selectedUnit = productUnitRef.current.value;
    const options = unitOptionsMap[selectedUnit] || unitOptionsMap.default;

    setSaleUnitOptions(options);
    setPurchaseUnitOptions(options);

    // Auto-select appropriate units based on the selected product unit
    if (selectedUnit === "kg") {
      // For kg, set sale unit to g and purchase unit to kg
      setSelectedSaleUnit("g");
      setSelectedPurchaseUnit("kg");
    } else if (selectedUnit === "l") {
      // For l, set sale unit to ml and purchase unit to l
      setSelectedSaleUnit("ml");
      setSelectedPurchaseUnit("l");
    } else if (selectedUnit === "pcs") {
      // For pcs, set both to pcs
      setSelectedSaleUnit("pcs");
      setSelectedPurchaseUnit("pcs");
    } else {
      // Reset to empty for other cases
      setSelectedSaleUnit("");
      setSelectedPurchaseUnit("");
    }
  };

  const handleProductUnitChangeUpdate = () => {
    const selectedUnit = productUnitUpdateRef.current.value;
    const options = unitOptionsMap[selectedUnit] || unitOptionsMap.default;

    setSaleUnitOptions(options);
    setPurchaseUnitOptions(options);

    // Auto-select appropriate units based on the selected product unit
    if (selectedUnit === "kg") {
      // For kg, set sale unit to g and purchase unit to kg
      setSelectedSaleUnitUpdate("g");
      setSelectedPurchaseUnitUpdate("kg");
    } else if (selectedUnit === "l") {
      // For l, set sale unit to ml and purchase unit to l
      setSelectedSaleUnitUpdate("ml");
      setSelectedPurchaseUnitUpdate("l");
    } else if (selectedUnit === "pcs") {
      // For pcs, set both to pcs
      setSelectedSaleUnitUpdate("pcs");
      setSelectedPurchaseUnitUpdate("pcs");
    } else {
      // Reset to empty for other cases
      setSelectedSaleUnitUpdate("");
      setSelectedPurchaseUnitUpdate("");
    }
  };

  const {
    APIURL: APIURLCategories,
    data: categories,
    error: errorCategories,
    isLoading: isLoadingCategories,
  } = useIngredientsCategories();

  // Fetching Ingredients
  const { APIURL, data, error, isLoading } = useIngredientsItems({
    page: state.spage,
    perPage: 12,
    itemName: state.search,
    isHouseKeeping: state.isHousekeeping,
    refreshKey,
  });

  if (isLoadingCategories) {
    return <Page>Please wait...</Page>;
  }

  if (errorCategories) {
    return <Page>Error loading details! Please Try Later!</Page>;
  }

  if (isLoading) {
    return <Page>Please wait...</Page>;
  }

  if (error) {
    return <Page>Error loading details! Please Try Later!</Page>;
  }
  // Destructure the response to extract ingredients data and pagination info
  const { data: ingredients, pagination } = data || {};
  console.log("ingredients", ingredients);
  const {
    page: currentPage,
    pageSize,
    totalItems,
    totalPages,
  } = pagination || {};

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

  const btnSearch = () => {
    const searchQuery = searchRef.current.value;
    if (!new String(searchQuery).trim()) {
      return;
    }

    setState({
      ...state,
      search: searchQuery,
      spage: 1,
    });
  };
  const btnClearSearch = () => {
    searchRef.current.value = null;

    setState({
      ...state,
      search: "",
      spage: 1,
    });
  };

  const btnIsHousekeeping = async () => {
    const isHouseKeep = filterHouseOrKitchenRef.current.value;

    setState({
      ...state,
      isHousekeeping: isHouseKeep,
    });
  };

  async function btnAdd() {
    const name = ingredientRef.current.value;
    const item_category_id = ingredientCategoryRef.current.value;
    const stock_alert = stockAlertRef.current.value;
    const is_house_keeping = isHousekeepingRef.current.checked ? "1" : "0";
    const product_unit = productUnitRef.current.value || null;
    const product_sale_unit = selectedSaleUnit || null;
    const product_purchase_unit = selectedPurchaseUnit || null;

    if (!name) {
      toast.error("Please enter ingredientName!");
      return;
    }

    if (stock_alert < 0) {
      toast.error("Please provide valid Stock Alert!");
      return;
    }

    try {
      toast.loading("Please wait...");

      const res = await addIngredientsItem(
        name,
        item_category_id,
        stock_alert,
        product_unit,
        product_sale_unit,
        product_purchase_unit,
        is_house_keeping
      );

      if (res.status == 200 || res.status == 201) {
        await mutate(APIURL);
        ingredientRef.current.value = null;
        ingredientCategoryRef.current.value = null;
        stockAlertRef.current.value = null;
        productUnitRef.current.value = null;
        setSelectedSaleUnit("");
        setSelectedPurchaseUnit("");
        isHousekeepingRef.current.checked = null;
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

  async function btnUpdate() {
    const name = ingredientUpdateRef.current.value;
    const item_category_id = ingredientCategoryUpdateRef.current.value;
    const stock_alert = stockAlertUpdateRef.current.value;
    const is_house_keeping = isHousekeepingUpdateRef.current.checked
      ? "1"
      : "0";
    const product_unit = productUnitUpdateRef.current.value || null;
    const product_sale_unit = selectedSaleUnitUpdate || null;
    const product_purchase_unit = selectedPurchaseUnitUpdate || null;

    if (!name) {
      toast.error("Please enter ingredientName!");
      return;
    }

    if (stock_alert < 0) {
      toast.error("Please provide valid Stock Alert!");
      return;
    }

    try {
      toast.loading("Please wait...");

      const res = await updateIngredientsItem(
        selectIngredientId,
        name,
        item_category_id,
        stock_alert,
        product_unit,
        product_sale_unit,
        product_purchase_unit,
        is_house_keeping
      );

      if (res.status == 200 || res.status == 201) {
        ingredientUpdateRef.current.value = null;
        ingredientCategoryUpdateRef.current.value = null;
        stockAlertUpdateRef.current.value = null;
        productUnitUpdateRef.current.value = null;
        setSelectedSaleUnitUpdate("");
        setSelectedPurchaseUnitUpdate("");
        isHousekeepingUpdateRef.current.checked = null;

        await mutate(APIURL);
        toast.dismiss();
        toast.success(res.data.message);
        selectIngredientId("");
        document.getElementById("modal-update").close();
      }
    } catch (error) {
      const message = error.response.data.message || "Something went wrong!";
      console.error(error);
      toast.dismiss();
      toast.error(message);
    }
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
      const res = await deleteIngredientsItem(id);

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

  const btnShowUpdate = (
    id,
    name,
    category_title,
    item_category_id,
    product_unit,
    stock_alert,
    product_sale_unit,
    product_purchase_unit,
    is_house_keeping
  ) => {
    ingredientUpdateRef.current.value = name;
    ingredientCategoryUpdateRef.current.value = item_category_id;
    stockAlertUpdateRef.current.value = stock_alert;
    isHousekeepingUpdateRef.current.checked = is_house_keeping === 1;
    productUnitUpdateRef.current.value = product_unit;

    // Set the appropriate unit options based on the product unit
    const options = unitOptionsMap[product_unit] || unitOptionsMap.default;
    setSaleUnitOptions(options);
    setPurchaseUnitOptions(options);

    // Apply auto-selection logic based on the product unit
    if (product_unit === "kg") {
      // For kg, set sale unit to g and purchase unit to kg
      setSelectedSaleUnitUpdate("g");
      setSelectedPurchaseUnitUpdate("kg");
    } else if (product_unit === "l") {
      // For l, set sale unit to ml and purchase unit to l
      setSelectedSaleUnitUpdate("ml");
      setSelectedPurchaseUnitUpdate("l");
    } else if (product_unit === "pcs") {
      // For pcs, set both to pcs
      setSelectedSaleUnitUpdate("pcs");
      setSelectedPurchaseUnitUpdate("pcs");
    } else {
      // For other cases, use the existing values
      setSelectedSaleUnitUpdate(product_sale_unit);
      setSelectedPurchaseUnitUpdate(product_purchase_unit);
    }

    setSelectIngredientId(id);
    document.getElementById("modal-update").showModal();
  };

  return (
    <Page className="px-8 py-6">
      <div className="flex md:items-center flex-col md:flex-row gap-2">
        <h3 className="text-3xl font-light mr-6">Add Ingredients</h3>
        <button
          onClick={() => {
            // Reset unit options when opening add modal
            setSaleUnitOptions([]);
            setPurchaseUnitOptions([]);
            setSelectedSaleUnit("");
            setSelectedPurchaseUnit("");
            document.getElementById("modal-add").showModal();
          }}
          className="rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-2 py-1 flex items-center gap-1 mr-4 w-fit"
        >
          <IconPlus size={22} stroke={iconStroke} /> New
        </button>
        <Link
          to="categories"
          className="w-fit rounded-lg border bg-gray-50 hover:bg-gray-100 transition active:scale-95 hover:shadow-lg text-gray-500 px-3 py-1"
        >
          Ingredients Categories
        </Link>
      </div>

      <div className="flex gap-2 mt-6">
        <div className="flex items-center px-4 py-1 bg-gray-100 rounded-lg">
          <select
            ref={filterHouseOrKitchenRef}
            name="from-store"
            className="block w-full bg-transparent outline-none placeholder:text-gray-400"
            placeholder="Filter Housekeeping Item"
            onChange={btnIsHousekeeping}
          >
            <option value="">Select a Type</option>
            <option value="1">Housekeeping Item</option>
            <option value="0">Kitchen Item</option>
          </select>
        </div>
        <div className="bg-gray-100 px-2 py-1 rounded-lg flex items-center">
          <input
            ref={searchRef}
            defaultValue={state.search}
            type="text"
            placeholder="Search Ingredients"
            className="bg-transparent placeholder:text-gray-400 outline-none block"
          />
          {state.search && (
            <button onClick={btnClearSearch} className="text-gray-400">
              <IconX stroke={iconStroke} size={18} />
            </button>
          )}
        </div>
        <button
          onClick={btnSearch}
          className="text-white bg-restro-green transition hover:bg-restro-green/80 active:scale-95 rounded-lg px-4 py-1 outline-restro-border-green-light"
        >
          Search
        </button>
      </div>

      <div className="mt-8 w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {ingredients.length === 0 ? (
          <div className="text-gray-500 text-center py-5">
            No menu items available.
          </div>
        ) : (
          ingredients?.map((menuItem, index) => {
            const {
              id,
              name,
              stock_alert,
              item_category_id,
              product_unit,
              product_purchase_unit,
              product_sale_unit,
              is_house_keeping,
              category_title,
              addons,
              variants,
            } = menuItem;

            return (
              <div
                key={id}
                className="border px-4 py-3 rounded-2xl flex flex-wrap items-center gap-2 text-sm"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
                  <IconBaguette />
                </div>
                <div className="flex-1">
                  <p>{name}</p>
                  <p className="text-gray-400 text-xs">{category_title}</p>
                  <div className="flex gap-7">
                    <p className="text-gray-400 text-xs">
                      Product Unit -{" "}
                      <span className="text-gray-600">{product_unit}</span>
                    </p>
                    <p className="text-gray-400 text-xs">
                      Stock Alert -{" "}
                      <span className="text-gray-600">{stock_alert}</span>
                    </p>
                  </div>
                  <p className="text-gray-400 text-xs">
                    Product Purchase Unit -{" "}
                    <span className="text-gray-600">
                      {product_purchase_unit}
                    </span>
                  </p>
                  <p className="text-gray-400 text-xs">
                    Product Sale Unit -{" "}
                    <span className="text-gray-600">{product_sale_unit}</span>
                  </p>
                </div>
                <div className="flex gap-0">
                  <button
                    onClick={() => {
                      btnShowUpdate(
                        id,
                        name,
                        category_title,
                        item_category_id,
                        product_unit,
                        stock_alert,
                        product_sale_unit,
                        product_purchase_unit,
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
        <p>
          Showing {ingredients.length} of {totalItems}
        </p>
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
          <div className="mt-4">
            <label
              htmlFor="ingredientCategory"
              className="mb-1 block text-gray-500 text-sm"
            >
              Ingredient Category
            </label>
            <select
              ref={ingredientCategoryRef}
              name="category"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Select Product Unit"
            >
              <option value="">None</option>
              {categories?.map((category, index) => {
                return (
                  <option value={category.id} key={category.id}>
                    {category.item_category_name}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex  w-full my-4">
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
              Is Housekeeping Item ?
            </label>
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
                onChange={handleProductUnitChange}
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
                value={selectedSaleUnit}
                onChange={(e) => setSelectedSaleUnit(e.target.value)}
                name="ingredientSaleUnit"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Ingredient Sale Unit"
              >
                {saleUnitOptions.length === 0 ? (
                  <option value="">None</option>
                ) : (
                  saleUnitOptions?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                )}
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
                value={selectedPurchaseUnit}
                onChange={(e) => setSelectedPurchaseUnit(e.target.value)}
                name="ingredientPurUnit"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Ingredient Purchase Unit"
              >
                {purchaseUnitOptions.length === 0 ? (
                  <option value="">None</option>
                ) : (
                  purchaseUnitOptions?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                )}
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

      {/* Update dialog */}
      <dialog id="modal-update" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Update Ingredients</h3>

          <div className="mt-4">
            <label
              htmlFor="ingredientName"
              className="mb-1 block text-gray-500 text-sm"
            >
              Ingredient Name
            </label>
            <input
              ref={ingredientUpdateRef}
              type="text"
              disabled
              name="ingredientName"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Item Ingredient Name"
            />
          </div>
          <div className="mt-4">
            <label
              htmlFor="ingredientCategory"
              className="mb-1 block text-gray-500 text-sm"
            >
              Ingredient Category
            </label>
            <select
              ref={ingredientCategoryUpdateRef}
              name="category"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Select Product Unit"
            >
              <option value="">None</option>
              {categories?.map((category, index) => {
                return (
                  <option value={category.id} key={category.id}>
                    {category.item_category_name}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex  w-full my-4">
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
              Is Housekeeping Item ?
            </label>
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
                ref={stockAlertUpdateRef}
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
                ref={productUnitUpdateRef}
                name="category"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Product Unit"
                onChange={handleProductUnitChangeUpdate}
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
                value={selectedSaleUnitUpdate}
                onChange={(e) => setSelectedSaleUnitUpdate(e.target.value)}
                name="ingredientSaleUnit"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Ingredient Sale Unit"
              >
                {saleUnitOptions.length === 0 ? (
                  <option value="">None</option>
                ) : (
                  saleUnitOptions?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                )}
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
                value={selectedPurchaseUnitUpdate}
                onChange={(e) => setSelectedPurchaseUnitUpdate(e.target.value)}
                name="ingredientPurUnit"
                className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
                placeholder="Select Ingredient Purchase Unit"
              >
                {purchaseUnitOptions.length === 0 ? (
                  <option value="">None</option>
                ) : (
                  purchaseUnitOptions?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                )}
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
                  btnUpdate();
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Update
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* Update dialog */}
    </Page>
  );
}
