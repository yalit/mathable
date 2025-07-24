import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./Home";
import RequestToPlay from "./RequestToPlay";
import Game from "./Game";
import { SessionProvider } from "convex-helpers/react/sessions";
import { useLocalStorage } from "usehooks-ts";

import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <SessionProvider useStorage={useLocalStorage}>
        <BrowserRouter>
          <Routes>
            <Route index element={<Home />} />
            <Route path="/game/:gameToken" element={<RequestToPlay />} />
            <Route
              path="/game/:gameToken/player/:playerToken"
              element={<Game />}
            />
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </ConvexProvider>
  </StrictMode>,
);
