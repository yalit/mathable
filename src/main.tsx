import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Game from "./components/Game.tsx";
import RequestToPlay from "./components/RequestToPlay.tsx";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <Routes>
          <Route index element={<App />} />
          <Route path="/game/:gameToken" element={<RequestToPlay />} />
          <Route
            path="/game/:gameToken/player/:playerToken"
            element={<Game />}
          />
        </Routes>
      </BrowserRouter>
    </ConvexProvider>
  </StrictMode>,
);
