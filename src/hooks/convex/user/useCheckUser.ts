import { useSessionMutation } from "convex-helpers/react/sessions";
import { api } from "@cvx/_generated/api";
import { useEffect } from "react";

export function useCheckUser(): void {
  const checkUser = useSessionMutation(
    api.controllers.user.mutations.createUser,
  );

  useEffect(() => {
    checkUser();
  }, []);
}
