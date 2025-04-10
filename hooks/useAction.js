import { useContext } from "react";
import { NetworkContext } from "./networkProvider";
import { useGlobalModal } from "../context/modalContext";

export default function useActionCheckNetwork() {
    const { isConnected } = useContext(NetworkContext);
    const { showModal } = useGlobalModal();

    const requireNetwork = (callback) => {
        if (!isConnected) {
            showModal("Lỗi kết nối mạng", "Không thể kết nối với internet. Vui lòng kiểm tra lại.");
        } else {
            callback();
        }
    };

    return requireNetwork;
}
