import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Home from "./Home.tsx";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Game from "./Game.tsx";
import RequestToPlay from "./RequestToPlay.tsx";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <div className="w-screen h-screen flex items-center justify-center">
          <Routes>
            <Route index element={<Home />} />
            <Route path="/game/:gameToken" element={<RequestToPlay />} />
            <Route
              path="/game/:gameToken/player/:playerToken"
              element={<Game />}
            />
          </Routes>
        </div>
      </BrowserRouter>
    </ConvexProvider>
  </StrictMode>,
);
