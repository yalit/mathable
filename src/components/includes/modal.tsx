import type { PropsWithChildren } from "react";

type ModalProps = PropsWithChildren & {
  closeModal: () => void;
  canClose: boolean;
};

export const Modal = ({ children, canClose, closeModal }: ModalProps) => {
  return (
    <div
      id="modal"
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-[1000]"
    >
      <div className="relative bg-white px-8 py-6 rounded min-w-[50vw] text-gray-800">
        {canClose && (
          <div className="absolute top-2 right-3" onClick={closeModal}>
            X
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
