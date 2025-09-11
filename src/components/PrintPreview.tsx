import { useEffect, useRef } from "react";
import styles from "./PrintPreview.module.css";
import type { FC } from "react";

type Props = {
  src: string;
  onClose: () => void;
};

const triggerPrint = (
  printContainer: HTMLDivElement,
  handleAfterPrint: () => void
) => {
  const img = printContainer.querySelector("img");

  const onImageLoad = () => {
    window.print();
  };

  if (img && !img.complete) {
    img.addEventListener("load", onImageLoad);
  } else {
    const printTimeout = setTimeout(onImageLoad, 100);
    return () => clearTimeout(printTimeout);
  }

  return () => {
    if (img) {
      img.removeEventListener("load", onImageLoad);
    }
    window.removeEventListener("afterprint", handleAfterPrint);
  };
};

const PrintPreview: FC<Props> = ({ src, onClose }) => {
  const printContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleAfterPrint = () => {
      onClose();
    };

    window.addEventListener("afterprint", handleAfterPrint);

    if (printContainerRef.current) {
      return triggerPrint(printContainerRef.current, handleAfterPrint);
    }

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [onClose, src]);

  return (
    <div
      id="print-sticker-container"
      className={styles.printContainer}
      ref={printContainerRef}
    >
      <img src={src} alt="Sticker to print" className={styles.stickerImage} />
    </div>
  );
};

export default PrintPreview;
