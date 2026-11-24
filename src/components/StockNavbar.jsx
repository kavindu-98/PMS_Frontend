/** @format */

import React from "react";
import { iconStroke } from "../config/config";
import { Link, useLocation } from "react-router-dom";
import { clsx } from "clsx";
import {
  IconArmchair2,
  IconBook,
  IconCreditCard,
  IconDevices,
  IconInfoSquareRounded,
  IconLifebuoy,
  IconPrinter,
  IconTransfer,
  IconReceiptTax,
  IconShoppingBag,
  IconShoppingBagDiscount,
  IconArrowBack,
  IconSalad,
} from "@tabler/icons-react";
export default function StockNavbar() {
  const { pathname } = useLocation();
  const items = [
    {
      icon: <IconShoppingBag stroke={iconStroke} />,
      text: "Add Stocks Details",
      path: "/dashboard/stock",
    },

    {
      icon: <IconPrinter stroke={iconStroke} />,
      text: "Stocks Expenses",
      path: "/dashboard/stock/stock-expenses",
    },
    {
      icon: <IconTransfer stroke={iconStroke} />,
      text: "Stocks Transfer",
      path: "/dashboard/stock/stock-transfer",
    },
    {
      icon: <IconShoppingBagDiscount stroke={iconStroke} />,
      text: "Stocks Consumption",
      path: "/dashboard/stock/stock-consumption",
    },
    {
      icon: <IconArrowBack stroke={iconStroke} />,
      text: "Stocks Return Log",
      path: "/dashboard/stock/stock-return",
    },
  ];

  return (
    <div className="w-20 md:w-60 h-screen overflow-y-auto border-r md:px-4 py-3 flex items-center flex-col gap-1 md:gap-3">
      {items?.map((item, index) => {
        return (
          <Link
            to={item.path}
            key={index}
            className={clsx(
              "w-12 h-12 md:w-full md:h-auto md:min-w-fit flex items-center justify-center md:justify-normal gap-1 md:px-4 md:py-3 rounded-full transition hover:bg-restro-border-green-light text-restro-green-dark",
              {
                "bg-restro-border-green-light font-medium":
                  item.path == pathname,
              }
            )}
          >
            {item.icon}
            <p className="hidden md:block">{item.text}</p>
          </Link>
        );
      })}
    </div>
  );
}
