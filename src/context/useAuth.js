import { useContext } from "react";
import AuthContext from "./authCtx";

export function useAuth() {
  return useContext(AuthContext);
}
