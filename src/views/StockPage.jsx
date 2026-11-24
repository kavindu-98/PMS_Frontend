/** @format */

import React from "react";
import Page from "../components/Page";
import StockNavbar from "../components/StockNavbar";
import { Outlet } from "react-router-dom";
export default function StockPage() {
  return (
    <Page className="flex">
      <StockNavbar />
      <div className="flex-1">
        <Outlet />
      </div>
    </Page>
  );
}
