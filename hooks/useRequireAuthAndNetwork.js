import { useContext } from "react";
import { AuthContext } from "../config/AuthContext";
import { NetworkContext } from "./networkProvider";
import { useGlobalModal } from "../context/modalContext";
import { useModalLogin } from "../context/modalLoginContext";

export default function useRequireAuthAndNetwork() {
  const { isGuest } = useContext(AuthContext);
  const { isConnected } = useContext(NetworkContext);
  const { showModal } = useGlobalModal();
  const { showModalLogin } = useModalLogin();

  const requireAuthAndNetwork = (callback) => {
    if (!isConnected) {
      showModal("Lỗi kết nối mạng", "Không thể kết nối với internet. Vui lòng kiểm tra lại.", t("modal.error"));
    } else if (isGuest) {
      console.log("roi vo case nay")
      showModalLogin("Yêu cầu đăng nhập", "Bạn cần đăng nhập để tiếp tục.", true);
    } else {
      callback();
    }
  };

  return requireAuthAndNetwork;
}
