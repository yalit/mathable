import { classnames } from "@libraries/helpers/dom";
import {type PropsWithChildren, useEffect} from "react";

type ModalProps = PropsWithChildren & {
  closeModal: () => void;
  canClose: boolean;
  classname?: string;
};

export const Modal = ({
  children,
  canClose,
  closeModal,
  classname = "",
}: ModalProps) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  })
  return (
    <div
      id="modal"
      className="fixed inset-0 flex justify-center items-center z-[1000]"
    >
      <div className="absolute inset-0 bg-black/70" onClick={closeModal} />
      <div
        className={classnames(
          "relative bg-white px-8 py-6 rounded min-w-[50vw] text-gray-800 pointer-events-[all]",
          classname,
        )}
      >
        {canClose && (
          <div
            className="absolute top-2 right-3 cursor-pointer"
            onClick={closeModal}
          >
            X
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
