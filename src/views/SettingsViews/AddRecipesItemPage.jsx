/** @format */

import React, { Children, useRef, useState } from "react";
import Page from "../../components/Page";
import { Link, useParams } from "react-router-dom";
import {
  useMenuItemRecipesByID,
  addMenuItemRecipe,
  updateMenuItemRecipes,
  updateVarientItemRecipes,
  updateAddonItemRecipes,
} from "../../controllers/menu_item.controller";
import { useIngredientsItems } from "../../controllers/ingredient_item.controller";
import toast from "react-hot-toast";
import { mutate } from "swr";

export default function AddRecipesItemPage() {
  const params = useParams();
  const itemId = params.id;

  const mainMenuItemIdRef = useRef(null);
  const mainMenuQuantityRef = useRef(null);

  const mainMenuItemIdUpdateRef = useRef(null);
  const mainMenuQuantityUpdateRef = useRef(null);

  const variantItemIdRef = useRef(null);
  const variantQuantityRef = useRef(null);

  const variantItemIdUpdateRef = useRef(null);
  const variantQuantityUpdateRef = useRef(null);

  const addonItemIdRef = useRef(null);
  const addonQuantityRef = useRef(null);

  const addonItemIdUpdateRef = useRef(null);
  const addonQuantityUpdateRef = useRef(null);

  const [state, setState] = useState({
    spage: 1,
    search: "",
  });

  const [ingredients, setIngredients] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [selectedVariantTitle, setSelectedVariantTitle] = useState(null);
  const [selectedAddonId, setSelectedAddonId] = useState(null);
  const [selectedAddonTitle, setSelectedAddonTitle] = useState(null);
  const [modalData, setModalData] = useState(null);

  const { data: IngredientsItems } = useIngredientsItems({
    page: state.spage,
    perPage: 100,
    isHouseKeeping: false,
  });

  const {
    APIURL,
    data: menuItem,
    error,
    isLoading,
  } = useMenuItemRecipesByID(itemId);

  // Add item to ingredients list
  const btnAddIngredients = (type, update) => {
    let selectedItem = null;
    let quantity = null;

    // Dynamically set selectedItem and quantity based on the type
    if (type === "mainMenu") {
      selectedItem = update
        ? mainMenuItemIdUpdateRef.current.value
        : mainMenuItemIdRef.current.value;
      quantity = update
        ? mainMenuQuantityUpdateRef.current.value
        : mainMenuQuantityRef.current.value;
    } else if (type === "variants") {
      selectedItem = update
        ? variantItemIdUpdateRef.current.value
        : variantItemIdRef.current.value;
      quantity = update
        ? variantQuantityUpdateRef.current.value
        : variantQuantityRef.current.value;
    } else if (type === "addons") {
      selectedItem = update
        ? addonItemIdUpdateRef.current.value
        : addonItemIdRef.current.value;
      quantity = update
        ? addonQuantityUpdateRef.current.value
        : addonQuantityRef.current.value;
    }

    if (!selectedItem) {
      toast.error("Please provide Ingredients Item!");
      return;
    }
    if (quantity <= 0) {
      toast.error("Please provide a valid quantity!");
      return;
    }

    const selectedItemId = Number(selectedItem);

    // Check if item already exists in ingredients or modalData
    const isDuplicate =
      ingredients.some((item) => item.raw_item_id === selectedItemId) ||
      (modalData &&
        modalData.some((item) => item.raw_item_id === selectedItemId));

    if (isDuplicate) {
      toast.error("Item already added!");
      return;
    }

    // Get item name and unit
    const itemData = IngredientsItems?.data.find(
      (item) => item.id === selectedItemId
    );
    if (!itemData) {
      toast.error("Invalid item selected!");
      return;
    }

    const newIngredient = {
      raw_item_id: selectedItemId,
      name: itemData.name,
      unit: itemData.product_sale_unit,
      quantity,
    };

    // Add the new ingredient
    setIngredients((prev) => [...prev, newIngredient]);

    // Clear inputs based on the type
    if (type === "mainMenu") {
      mainMenuItemIdRef.current.value = "";
      mainMenuQuantityRef.current.value = "";
    } else if (type === "variants") {
      variantItemIdRef.current.value = "";
      variantQuantityRef.current.value = "";
    } else if (type === "addons") {
      addonItemIdRef.current.value = "";
      addonQuantityRef.current.value = "";
    }
  };

  // Remove item from ingredients modalData list
  const removeIngredientModalData = (raw_item_id) => {
    setModalData((prev) =>
      prev.filter((item) => item.raw_item_id !== raw_item_id)
    );
  };

  if (isLoading) {
    return <Page>Please wait...</Page>;
  }

  if (error) {
    return <Page>Error loading details! Please Try Later!</Page>;
  }

  const {
    id,
    title,
    category_id,
    category_title,
    tax_id,
    tax_title,
    tax_rate,
    tax_type,
    price,
    net_price,
    addons,
    variants,
    menu_recipe_items,
    image,
  } = menuItem || [];

  async function btnAddRecipe() {
    const recipeType = "menu";

    try {
      toast.loading("Please wait...");

      const filteredIngredients = ingredients?.map(
        ({ raw_item_id, quantity }) => ({
          rawItemId: raw_item_id,
          quantity,
        })
      );

      const res = await addMenuItemRecipe(id, recipeType, filteredIngredients);

      if (res.status == 200 || res.status == 201) {
        await mutate(APIURL);
        // window.location.reload();
        toast.dismiss();
        toast.success(res.data.message);
        resetIngredients();
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);

      toast.dismiss();
      toast.error(message);
    }
  }
  async function btnUpdateMenuRecipe() {
    const recipe_type = "menu";

    try {
      toast.loading("Please wait...");

      const menu_item_id = id;

      // Check if modalData is available
      const previousItems = modalData
        ? modalData?.map(({ raw_item_id, quantity }) => ({
            raw_item_id: String(raw_item_id),
            quantity: Number(quantity),
          }))
        : [];

      const newItems = ingredients?.map(({ raw_item_id, quantity }) => ({
        raw_item_id: String(raw_item_id),
        quantity: Number(quantity),
      }));

      // Merge existing and new items, ensuring no duplicates
      const combinedItems = [...previousItems, ...newItems].reduce(
        (acc, item) => {
          const existingItem = acc.find(
            (i) => i.raw_item_id === item.raw_item_id
          );
          if (existingItem) {
            existingItem.quantity = item.quantity; // Update quantity if duplicate
          } else {
            acc.push(item);
          }
          return acc;
        },
        []
      );

      const res = await updateMenuItemRecipes(
        itemId,
        menu_item_id,
        title,
        recipe_type,
        combinedItems
      );

      if (res.status === 200 || res.status === 201) {
        toast.dismiss();
        await mutate(APIURL);
        // window.location.reload();
        toast.success(res.data.message);
        resetIngredients();
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);
      toast.dismiss();
      toast.error(message);
    }
  }

  async function btnAddRecipeVariants() {
    const recipe_type = "variants";

    try {
      toast.loading("Please wait...");

      const filteredIngredients = ingredients?.map(
        ({ raw_item_id, quantity }) => ({
          rawItemId: raw_item_id,
          quantity,
        })
      );

      const res = await addMenuItemRecipe(
        selectedVariantId,
        recipe_type,
        filteredIngredients
      );

      if (res.status == 200 || res.status == 201) {
        await mutate(APIURL);
        // window.location.reload();
        toast.dismiss();
        toast.success(res.data.message);
        resetIngredients();
        setSelectedVariantId("");
        setSelectedVariantTitle("");
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);

      toast.dismiss();
      toast.error(message);
    }
  }
  async function btnUpdateRecipeVariants() {
    const recipe_type = "variants";
    try {
      toast.loading("Please wait...");

      const menu_item_id = selectedVariantId;

      // Extract previous items from modalData (if available)
      const previousItems = modalData
        ? modalData?.map(({ raw_item_id, quantity }) => ({
            raw_item_id: String(raw_item_id),
            quantity: Number(quantity),
          }))
        : [];

      // Extract new ingredients from state
      const newItems = ingredients?.map(({ raw_item_id, quantity }) => ({
        raw_item_id: String(raw_item_id),
        quantity: Number(quantity),
      }));

      // Merge previous and new items, ensuring no duplicates
      const combinedItems = [...previousItems, ...newItems].reduce(
        (acc, item) => {
          const existingItem = acc.find(
            (i) => i.raw_item_id === item.raw_item_id
          );
          if (existingItem) {
            existingItem.quantity = item.quantity; // Update quantity if exists
          } else {
            acc.push(item);
          }
          return acc;
        },
        []
      );

      // Call the update function
      const res = await updateVarientItemRecipes(
        itemId,
        menu_item_id,
        title,
        recipe_type,
        combinedItems
      );

      if (res.status === 200 || res.status === 201) {
        toast.dismiss();
        await mutate(APIURL);
        // window.location.reload();
        toast.success(res.data.message);
        resetIngredients();
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);
      toast.dismiss();
      toast.error(message);
    }
  }

  async function btnUpdateRecipeAddons() {
    const recipe_type = "addons";
    try {
      toast.loading("Please wait...");

      const menu_item_id = selectedAddonId;

      // Extract previous items from modalData (if available)
      const previousItems = modalData
        ? modalData?.map(({ raw_item_id, quantity }) => ({
            raw_item_id: String(raw_item_id),
            quantity: Number(quantity),
          }))
        : [];

      // Extract new ingredients from state
      const newItems = ingredients?.map(({ raw_item_id, quantity }) => ({
        raw_item_id: String(raw_item_id),
        quantity: Number(quantity),
      }));

      // Merge previous and new items, ensuring no duplicates
      const combinedItems = [...previousItems, ...newItems].reduce(
        (acc, item) => {
          const existingItem = acc.find(
            (i) => i.raw_item_id === item.raw_item_id
          );
          if (existingItem) {
            existingItem.quantity = item.quantity; // Update quantity if exists
          } else {
            acc.push(item);
          }
          return acc;
        },
        []
      );
      // Call the update function
      const res = await updateAddonItemRecipes(
        itemId,
        menu_item_id, // menu_item_id
        title,
        recipe_type,
        combinedItems
      );

      if (res.status === 200 || res.status === 201) {
        toast.dismiss();
        await mutate(APIURL);
        // window.location.reload();
        toast.success("Recipe updated successfully!");
        resetIngredients();
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);
      toast.dismiss();
      toast.error(message);
    }
  }

  async function btnAddRecipeAddons() {
    const recipe_type = "addons";

    try {
      toast.loading("Please wait...");

      const filteredIngredients = ingredients?.map(
        ({ raw_item_id, quantity }) => ({
          rawItemId: raw_item_id,
          quantity,
        })
      );

      const res = await addMenuItemRecipe(
        selectedAddonId,
        recipe_type,
        filteredIngredients
      );

      if (res.status == 200 || res.status == 201) {
        await mutate(APIURL);
        // window.location.reload();
        toast.dismiss();
        toast.success(res.data.message);
        resetIngredients();
        setSelectedAddonId("");
        setSelectedAddonTitle("");
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Something went wrong!";
      console.error(error);

      toast.dismiss();
      toast.error(message);
    }
  }

  const resetIngredients = () => {
    setIngredients([]);
    setSelectedVariantId("");
    setSelectedVariantTitle("");
    setSelectedAddonId("");
    setSelectedAddonTitle("");
    mainMenuItemIdRef.current.value = "";
    mainMenuQuantityRef.current.value = null;
    variantItemIdRef.current.value = "";
    variantQuantityRef.current.value = null;
    addonItemIdRef.current.value = "";
    addonQuantityRef.current.value = null;
    variantItemIdUpdateRef.current.value = "";
    variantQuantityUpdateRef.current.value = null;
    addonItemIdUpdateRef.current.value = "";
    addonQuantityUpdateRef.current.value = null;
    mainMenuItemIdUpdateRef.current.value = "";
    mainMenuQuantityUpdateRef.current.value = null;
  };

  return (
    <Page className="px-4 md:px-8 py-3 md:py-6">
      <div className="text-sm breadcrumbs">
        <ul>
          <li>
            <Link to="/dashboard/settings">Settings</Link>
          </li>
          <li>
            {/* <Link
              to="/dashboard/settings/add-recipes/update"
              state={menuItem} // Pass menuItem data here
            >
              Update Recipes
            </Link> */}
            <Link to="/dashboard/settings/add-recipes">Update Recipes</Link>
          </li>
          <li>{title}</li>
        </ul>
      </div>

      {title && <p className="text-mm text-gray-800">Menu Item : {title}</p>}
      {category_id && (
        <p className="text-sm text-gray-500">Category : {category_title}</p>
      )}
      {price && <p className="text-sm text-gray-500">Price : {price}</p>}
      {net_price && (
        <p className="text-sm text-gray-700">Net Price : {net_price}</p>
      )}

      <div className="my-6 flex gap-6 flex-col lg:flex-row">
        <div className="flex-1">
          {/* menu Item Recipes */}
          <div className="collapse bg-gray-50 collapse-arrow mt-6">
            <input type="checkbox" />
            <div className="collapse-title font-medium">
              Show Menu Item Recipe
            </div>

            <div className="collapse-content flex flex-col">
              {/*  {menu_recipe_items && menu_recipe_items.length > 0 ? (*/}
              <button
                onClick={() => {
                  // setSelectedMenuRecipeId(menu_recipe_items[0].recipe_id);
                  setModalData(menu_recipe_items); // Pass data to state
                  document
                    .getElementById("modal-update-ingredients")
                    .showModal();
                }}
                className="btn btn-sm mt-4"
              >
                Show Menu Item Ingredients
              </button>
              {/*   ) : (*/}
              <button
                onClick={() =>
                  document.getElementById("modal-add-ingredients").showModal()
                }
                className="btn btn-sm mt-4"
              >
                + Add Ingredients
              </button>
              {/*   )}*/}
            </div>
          </div>
          {/* menu Item Recipes */}

          {/* variants */}
          <div className="collapse bg-gray-50 collapse-arrow mt-6">
            <input type="checkbox" />
            <div className="collapse-title font-medium">
              Show Variants Recipe
            </div>
            <div className="collapse-content flex flex-col">
              {variants?.map((variant, index) => {
                return (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between hover:bg-gray-100 transition p-2 rounded-lg cursor-pointer"
                  >
                    <div className="flex-1">
                      <p>{variant.title}</p>
                      <p className="text-xs text-gray-500">
                        Price: {variant.price}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {/* {variant.recipe && variant.recipe.length > 0 ? ( */}
                      {/* // Show button if `recipe` has values */}
                      <button
                        onClick={() => {
                          setSelectedVariantId(variant.id);
                          setModalData(variant.recipe); // Pass data to state
                          setSelectedVariantTitle(variant.title);
                          document
                            .getElementById("modal-update-ingredients-variants")
                            .showModal();
                        }}
                        className="btn btn-sm mt-4 mr-5"
                      >
                        Show Variant Item Ingredients
                      </button>
                      {/* ) : ( */}
                      {/* // Show button if `recipe` has no values */}
                      <button
                        onClick={() => {
                          setSelectedVariantId(variant.id); // Set the selected id
                          setSelectedVariantTitle(variant.title); // Set the selected variant title
                          document
                            .getElementById("modal-add-ingredients-variants")
                            .showModal();
                        }}
                        className="btn btn-sm mt-4"
                      >
                        + Add Ingredients
                      </button>
                      {/* )} */}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* variants */}

          {/* addons */}
          <div className="collapse bg-gray-50 collapse-arrow mt-4">
            <input type="checkbox" />
            <div className="collapse-title font-medium">Show Addons Recipe</div>
            <div className="collapse-content flex flex-col">
              {addons?.map((addon, index) => {
                return (
                  <div
                    key={addon.id}
                    className="flex items-center justify-between hover:bg-gray-100 transition p-2 rounded-lg cursor-pointer"
                  >
                    <div className="flex-1">
                      <p>{addon.title}</p>
                      <p className="text-xs text-gray-500">
                        Price: {addon.price}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {/* // Show this button if `recipe` exists and has values */}
                      <button
                        onClick={() => {
                          setSelectedAddonId(addon.id);
                          setModalData(addon.recipe); // Pass data to state
                          setSelectedAddonTitle(addon.title);
                          document
                            .getElementById("modal-update-ingredients-addons")
                            .showModal();
                        }}
                        className="btn btn-sm mt-4 mr-5"
                      >
                        Show Addon Item Ingredients
                      </button>

                      <button
                        onClick={() => {
                          setSelectedAddonId(addon.id); // Set the selected id
                          setSelectedAddonTitle(addon.title); // Set the selected addon title
                          document
                            .getElementById("modal-add-ingredients-addons")
                            .showModal();
                        }}
                        className="btn btn-sm mt-4"
                      >
                        + Add Ingredients
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* addons */}
        </div>
      </div>

      {/* ingredients add to main menu dialog */}
      <dialog
        id="modal-add-ingredients"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            Add Recipe Ingredients to Main Menu
          </h3>

          <div className="my-4">
            <label
              htmlFor="itemName"
              className="mb-1 block text-gray-500 text-sm"
            >
              Item Name
            </label>
            <select
              ref={mainMenuItemIdUpdateRef}
              defaultValue={""}
              name="itemName"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Select Item Name"
            >
              <option value="">None</option>
              {IngredientsItems?.data?.map((item, index) => {
                return (
                  <option value={item.id} key={item.id}>
                    {item.name} - {item.product_sale_unit}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="my-4">
            <label
              htmlFor="quantity"
              className="mb-1 block text-gray-500 text-sm"
            >
              Quantity
            </label>
            <input
              ref={mainMenuQuantityUpdateRef}
              type="number"
              name="quantity"
              defaultValue={""}
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Quantity"
            />
          </div>
          <button
            onClick={() => btnAddIngredients("mainMenu", true)}
            className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
          >
            + Add
          </button>

          {/* Display Ingredients as Tags */}
          <div className="my-4">
            {ingredients?.map((ingredient) => (
              <div
                key={ingredient.raw_item_id}
                className="inline-flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mr-2 mb-2"
              >
                <span>
                  {ingredient.name} - ({ingredient.quantity} {ingredient.unit})
                </span>
                <button
                  onClick={() => removeIngredient(ingredient.raw_item_id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button
                className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
                onClick={resetIngredients}
              >
                Close
              </button>
              <button
                onClick={() => {
                  btnAddRecipe();
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* ingredients add to main menu dialog */}
      {/* ingredients update in main menu dialog */}
      <dialog
        id="modal-update-ingredients"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            Update Recipe Ingredients to Main Menu
          </h3>

          <div className="my-4">
            <label
              htmlFor="itemName"
              className="mb-1 block text-gray-500 text-sm"
            >
              Item Name
            </label>
            <select
              ref={mainMenuItemIdRef}
              defaultValue={""}
              name="itemName"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Select Item Name"
            >
              <option value="">None</option>
              {IngredientsItems?.data?.map((item, index) => {
                return (
                  <option value={item.id} key={item.id}>
                    {item.name} - {item.product_sale_unit}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="my-4">
            <label
              htmlFor="quantity"
              className="mb-1 block text-gray-500 text-sm"
            >
              Quantity
            </label>
            <input
              ref={mainMenuQuantityRef}
              type="number"
              name="quantity"
              defaultValue={""}
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Quantity"
            />
          </div>
          <button
            onClick={() => btnAddIngredients("mainMenu")}
            className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
          >
            + Add
          </button>

          {/* Display Ingredients as Tags */}
          <div className="my-4">
            {modalData && modalData?.length > 0 ? (
              <div className="my-4">
                {modalData.map((ingredient) => (
                  <div
                    key={ingredient.raw_item_id}
                    className="inline-flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mr-2 mb-2"
                  >
                    <span>
                      {ingredient.name} - ({ingredient.quantity}{" "}
                      {ingredient.product_sale_unit})
                    </span>
                    <button
                      onClick={() =>
                        removeIngredientModalData(ingredient.raw_item_id)
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">No ingredients added yet.</div>
            )}
            {ingredients?.map((ingredient) => (
              <div
                key={ingredient.raw_item_id}
                className="inline-flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mr-2 mb-2"
              >
                <span>
                  {ingredient.name} - ({ingredient.quantity} {ingredient.unit})
                </span>
                <button
                  onClick={() => removeIngredient(ingredient.raw_item_id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button
                className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
                onClick={resetIngredients}
              >
                Close
              </button>
              <button
                onClick={() => {
                  btnUpdateMenuRecipe(id);
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* ingredients update in main menu dialog */}

      {/* ingredients add to variants dialog */}
      <dialog
        id="modal-add-ingredients-variants"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            {" "}
            Add Recipe Ingredients to {selectedVariantTitle}
          </h3>

          <div className="my-4">
            <label
              htmlFor="itemName"
              className="mb-1 block text-gray-500 text-sm"
            >
              Item Name
            </label>
            <select
              ref={variantItemIdUpdateRef}
              defaultValue={""}
              name="itemName"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Select Item Name"
            >
              <option value="">None</option>
              {IngredientsItems?.data?.map((item, index) => {
                return (
                  <option value={item.id} key={item.id}>
                    {item.name} - {item.product_sale_unit}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="my-4">
            <label
              htmlFor="quantity"
              className="mb-1 block text-gray-500 text-sm"
            >
              Quantity
            </label>
            <input
              ref={variantQuantityUpdateRef}
              type="number"
              name="quantity"
              defaultValue={""}
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Quantity"
            />
          </div>
          <button
            onClick={() => btnAddIngredients("variants", true)}
            className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
          >
            + Add
          </button>

          <div className="my-4">
            {ingredients?.map((ingredient) => (
              <div
                key={ingredient.raw_item_id}
                className="inline-flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mr-2 mb-2"
              >
                <span>
                  {ingredient.name} - ({ingredient.quantity} {ingredient.unit})
                </span>
                <button
                  onClick={() => removeIngredient(ingredient.raw_item_id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button
                className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
                onClick={resetIngredients}
              >
                Close
              </button>
              <button
                onClick={() => {
                  btnAddRecipeVariants();
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* ingredients add to variants dialog  */}

      {/* ingredients add to addon dialog */}
      <dialog
        id="modal-add-ingredients-addons"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            {" "}
            Add Recipe Ingredients to {selectedAddonTitle}
          </h3>

          <div className="my-4">
            <label
              htmlFor="itemName"
              className="mb-1 block text-gray-500 text-sm"
            >
              Item Name
            </label>
            <select
              ref={addonItemIdUpdateRef}
              defaultValue={""}
              name="itemName"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Select Item Name"
            >
              <option value="">None</option>
              {IngredientsItems?.data?.map((item, index) => {
                return (
                  <option value={item.id} key={item.id}>
                    {item.name} - {item.product_sale_unit}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="my-4">
            <label
              htmlFor="quantity"
              className="mb-1 block text-gray-500 text-sm"
            >
              Quantity
            </label>
            <input
              ref={addonQuantityUpdateRef}
              type="number"
              name="quantity"
              defaultValue={""}
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Quantity"
            />
          </div>
          <button
            onClick={() => btnAddIngredients("addons", true)}
            className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
          >
            + Add
          </button>

          {/* Display Ingredients as Tags */}
          <div className="my-4">
            {ingredients?.map((ingredient) => (
              <div
                key={ingredient.raw_item_id}
                className="inline-flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mr-2 mb-2"
              >
                <span>
                  {ingredient.name} - ({ingredient.quantity} {ingredient.unit})
                </span>
                <button
                  onClick={() => removeIngredient(ingredient.raw_item_id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button
                className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
                onClick={resetIngredients}
              >
                Close
              </button>
              <button
                onClick={() => {
                  btnAddRecipeAddons();
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* ingredients add to addon dialog  */}

      {/* variant update dialog */}
      <dialog
        id="modal-update-ingredients-variants"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            {" "}
            Update Recipe Ingredients to {selectedVariantTitle}
          </h3>

          <div className="my-4">
            <label
              htmlFor="itemName"
              className="mb-1 block text-gray-500 text-sm"
            >
              Item Name
            </label>
            <select
              ref={variantItemIdRef}
              defaultValue={""}
              name="itemName"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Select Item Name"
            >
              <option value="">None</option>
              {IngredientsItems?.data?.map((item, index) => {
                return (
                  <option value={item.id} key={item.id}>
                    {item.name} - {item.product_sale_unit}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="my-4">
            <label
              htmlFor="quantity"
              className="mb-1 block text-gray-500 text-sm"
            >
              Quantity
            </label>
            <input
              ref={variantQuantityRef}
              type="number"
              name="quantity"
              defaultValue={""}
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Quantity"
            />
          </div>
          <button
            onClick={() => btnAddIngredients("variants")}
            className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
          >
            + Add
          </button>

          {/* Display Ingredients as Tags */}
          <div className="my-4">
            {modalData && modalData?.length > 0 ? (
              <div className="my-4">
                {modalData.map((ingredient) => (
                  <div
                    key={ingredient.raw_item_id}
                    className="inline-flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mr-2 mb-2"
                  >
                    <span>
                      {ingredient.name} - ({ingredient.quantity}{" "}
                      {ingredient.product_sale_unit})
                    </span>
                    <button
                      onClick={() =>
                        removeIngredientModalData(ingredient.raw_item_id)
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">No ingredients added yet.</div>
            )}
            {ingredients?.map((ingredient) => (
              <div
                key={ingredient.raw_item_id}
                className="inline-flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mr-2 mb-2"
              >
                <span>
                  {ingredient.name} - ({ingredient.quantity} {ingredient.unit})
                </span>
                <button
                  onClick={() => removeIngredient(ingredient.raw_item_id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button
                className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
                onClick={resetIngredients}
              >
                Close
              </button>
              <button
                onClick={() => {
                  btnUpdateRecipeVariants(id);
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* variant update dialog */}

      {/* addon update dialog */}
      <dialog
        id="modal-update-ingredients-addons"
        className="modal modal-bottom sm:modal-middle"
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            {" "}
            Update Recipe Ingredients to {selectedAddonTitle}
          </h3>

          <div className="my-4">
            <label
              htmlFor="itemName"
              className="mb-1 block text-gray-500 text-sm"
            >
              Item Name
            </label>
            <select
              ref={addonItemIdRef}
              defaultValue={""}
              name="itemName"
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Select Item Name"
            >
              <option value="">None</option>
              {IngredientsItems?.data?.map((item, index) => {
                return (
                  <option value={item.id} key={item.id}>
                    {item.name} - {item.product_sale_unit}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="my-4">
            <label
              htmlFor="quantity"
              className="mb-1 block text-gray-500 text-sm"
            >
              Quantity
            </label>
            <input
              ref={addonQuantityRef}
              type="number"
              name="quantity"
              defaultValue={""}
              className="text-sm w-full border rounded-lg px-4 py-2 bg-gray-50 outline-restro-border-green-light"
              placeholder="Enter Quantity"
            />
          </div>
          <button
            onClick={() => btnAddIngredients("addons")}
            className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
          >
            + Add
          </button>

          {/* Display Ingredients as Tags */}
          <div className="my-4">
            {modalData && modalData?.length > 0 ? (
              <div className="my-4">
                {modalData.map((ingredient) => (
                  <div
                    key={ingredient.raw_item_id}
                    className="inline-flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mr-2 mb-2"
                  >
                    <span>
                      {ingredient.name} - ({ingredient.quantity}{" "}
                      {ingredient.product_sale_unit})
                    </span>
                    <button
                      onClick={() =>
                        removeIngredientModalData(ingredient.raw_item_id)
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">No ingredients added yet.</div>
            )}
            {ingredients?.map((ingredient) => (
              <div
                key={ingredient.raw_item_id}
                className="inline-flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600 mr-2 mb-2"
              >
                <span>
                  {ingredient.name} - ({ingredient.quantity} {ingredient.unit})
                </span>
                <button
                  onClick={() => removeIngredient(ingredient.raw_item_id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button
                className="rounded-lg hover:bg-gray-200 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-gray-200 text-gray-500"
                onClick={resetIngredients}
              >
                Close
              </button>
              <button
                onClick={() => {
                  btnUpdateRecipeAddons(id);
                }}
                className="rounded-lg hover:bg-green-800 transition active:scale-95 hover:shadow-lg px-4 py-3 bg-restro-green text-white ml-3"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </dialog>
      {/* addon update dialog */}
    </Page>
  );
}
