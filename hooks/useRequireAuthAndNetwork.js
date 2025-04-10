import { useContext } from "react";
import { AuthContext } from "../config/AuthContext";
import { NetworkContext } from "./networkProvider";
import { useGlobalModal } from "../context/modalContext";

export default function useRequireAuthAndNetwork() {
  const { isGuest } = useContext(AuthContext);
  const { isConnected } = useContext(NetworkContext);
  const { showModal } = useGlobalModal();

  const requireAuthAndNetwork = (callback) => {
    if (!isConnected) {
      showModal("Lỗi kết nối mạng", "Không thể kết nối với internet. Vui lòng kiểm tra lại.");
    } else if (isGuest) {
      showModal("Yêu cầu đăng nhập", "Bạn cần đăng nhập để tiếp tục.", true);
    } else {
      callback();
    }
  };

  return requireAuthAndNetwork;
}
