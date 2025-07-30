import { GameProvider } from "@context/gameProvider";
import { SessionProvider } from "convex-helpers/react/sessions";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Outlet } from "react-router-dom";
import { useLocalStorage } from "usehooks-ts";

import "./index.css";
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

export const App = () => {
  return (
    <ConvexProvider client={convex}>
      <SessionProvider useStorage={useLocalStorage}>
        <GameProvider>
          <Outlet />
        </GameProvider>
      </SessionProvider>
    </ConvexProvider>
  );
};
