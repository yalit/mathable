import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./Home";
import RequestToPlay from "./RequestToPlay";
import Game from "./Game";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route path="/game/:gameToken" element={<RequestToPlay />} />
          <Route
            path="/game/:gameToken/player/:playerToken"
            element={<Game />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
