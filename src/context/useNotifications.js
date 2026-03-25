import { useContext } from "react";
import NotificationContext from "./notificationCtx";

export function useNotifications() {
  return useContext(NotificationContext);
}
