import { classnames } from "@libraries/helpers/dom";

type NumberIconProps = {
  icon: number;
  className?: string;
};
export const NumberIcon = ({ icon, className = "" }: NumberIconProps) => {
  const icons = {
    0: (
      <svg
        data-prefix="fas"
        data-icon="0"
        className={classnames("svg-inline--fa fa-0 ", className)}
        role="img"
        viewBox="0 0 256 512"
      >
        <path
          fill="currentColor"
          d="M0 192C0 103.6 71.6 32 160 32s160 71.6 160 160l0 128c0 88.4-71.6 160-160 160S0 408.4 0 320L0 192zM160 96c-53 0-96 43-96 96l0 128c0 53 43 96 96 96s96-43 96-96l0-128c0-53-43-96-96-96z"
        />
      </svg>
    ),
    1: (
      <svg
        data-prefix="fas"
        data-icon="1"
        className={classnames("svg-inline--fa fa-1 ", className)}
        role="img"
        viewBox="0 0 256 512"
      >
        <path
          fill="currentColor"
          d="M32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l64 0 0 320-64 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0 0-352c0-17.7-14.3-32-32-32L32 32z"
        />
      </svg>
    ),
    2: (
      <svg
        data-prefix="fas"
        data-icon="2"
        className={classnames("svg-inline--fa fa-2 ", className)}
        role="img"
        viewBox="0 0 256 512"
      >
        <path
          fill="currentColor"
          d="M48 64c0-17.7 14.3-32 32-32l171 0c60.2 0 109 48.8 109 109 0 43.8-26.2 83.3-66.4 100.4l-139.1 59C119 315.4 96 350.2 96 388.7l0 27.3 224 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L64 480c-17.7 0-32-14.3-32-32l0-59.3c0-64.2 38.4-122.2 97.5-147.3l139.1-59c16.6-7.1 27.4-23.4 27.4-41.4 0-24.9-20.2-45-45-45L80 96C62.3 96 48 81.7 48 64z"
        />
      </svg>
    ),
    3: (
      <svg
        data-prefix="fas"
        data-icon="3"
        className={classnames("svg-inline--fa fa-3 ", className)}
        role="img"
        viewBox="0 0 256 512"
      >
        <path
          fill="currentColor"
          d="M80 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l112 0c35.3 0 64-28.7 64-64s-28.7-64-64-64L32 96C14.3 96 0 81.7 0 64S14.3 32 32 32l160 0c70.7 0 128 57.3 128 128 0 38.2-16.8 72.5-43.3 96 26.6 23.5 43.3 57.8 43.3 96 0 70.7-57.3 128-128 128L32 480c-17.7 0-32-14.3-32-32s14.3-32 32-32l160 0c35.3 0 64-28.7 64-64s-28.7-64-64-64L80 288z"
        />
      </svg>
    ),
    4: (
      <svg
        data-prefix="fas"
        data-icon="4"
        className={classnames("svg-inline--fa fa-4 ", className)}
        role="img"
        viewBox="0 0 256 512"
      >
        <path
          fill="currentColor"
          d="M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64L0 288c0 35.3 28.7 64 64 64l192 0 0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96 32 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-32 0 0-224c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 224-192 0 0-224z"
        />
      </svg>
    ),
    5: (
      <svg
        data-prefix="fas"
        data-icon="5"
        className={classnames("svg-inline--fa fa-5 ", className)}
        role="img"
        viewBox="0 0 256 512"
      >
        <path
          fill="currentColor"
          d="M0 64C0 46.3 14.3 32 32 32l224 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-192 0 0 112 120 0c75.1 0 136 60.9 136 136S259.1 480 184 480L32 480c-17.7 0-32-14.3-32-32s14.3-32 32-32l152 0c39.8 0 72-32.2 72-72s-32.2-72-72-72L32 272c-17.7 0-32-14.3-32-32L0 64z"
        />
      </svg>
    ),
    6: (
      <svg
        data-prefix="fas"
        data-icon="6"
        className={classnames("svg-inline--fa fa-6 ", className)}
        role="img"
        viewBox="0 0 256 512"
      >
        <path
          fill="currentColor"
          d="M256 32c17.7 0 32 14.3 32 32s-14.3 32-32 32l-88 0c-48.6 0-88 39.4-88 88l0 32.2c22.9-15.3 50.4-24.2 80-24.2l48 0c79.5 0 144 64.5 144 144S287.5 480 208 480l-48 0C80.5 480 16 415.5 16 336l0-152C16 100.1 84.1 32 168 32l88 0zM80 336c0 44.2 35.8 80 80 80l48 0c44.2 0 80-35.8 80-80s-35.8-80-80-80l-48 0c-44.2 0-80 35.8-80 80z"
        />
      </svg>
    ),
    7: (
      <svg
        data-prefix="fas"
        data-icon="7"
        className={classnames("svg-inline--fa fa-7 ", className)}
        role="img"
        viewBox="0 0 256 512"
      >
        <path
          fill="currentColor"
          d="M0 64C0 46.3 14.3 32 32 32l256 0c11.5 0 22 6.1 27.7 16.1s5.7 22.2-.1 32.1l-224 384c-8.9 15.3-28.5 20.4-43.8 11.5s-20.4-28.5-11.5-43.8L232.3 96 32 96C14.3 96 0 81.7 0 64z"
        />
      </svg>
    ),
    8: (
      <svg
        data-prefix="fas"
        data-icon="8"
        className={classnames("svg-inline--fa fa-8 ", className)}
        role="img"
        viewBox="0 0 256 512"
      >
        <path
          fill="currentColor"
          d="M304 160c0-70.7-57.3-128-128-128l-32 0c-70.7 0-128 57.3-128 128 0 34.6 13.7 66 36 89-31.5 23.3-52 60.8-52 103 0 70.7 57.3 128 128 128l64 0c70.7 0 128-57.3 128-128 0-42.2-20.5-79.7-52-103 22.3-23 36-54.4 36-89zM176.1 288l15.9 0c35.3 0 64 28.7 64 64s-28.7 64-64 64l-64 0c-35.3 0-64-28.7-64-64s28.7-64 64-64l48.1 0zm0-64L144 224c-35.3 0-64-28.7-64-64 0-35.3 28.7-64 64-64l32 0c35.3 0 64 28.7 64 64 0 35.3-28.6 64-64 64z"
        />
      </svg>
    ),
    9: (
      <svg
        data-prefix="fas"
        data-icon="9"
        className={classnames("svg-inline--fa fa-9 ", className)}
        role="img"
        viewBox="0 0 256 512"
      >
        <path
          fill="currentColor"
          d="M208 320c29.6 0 57.1-8.9 80-24.2l0 32.2c0 48.6-39.4 88-88 88L96 416c-17.7 0-32 14.3-32 32s14.3 32 32 32l104 0c83.9 0 152-68.1 152-152l0-152.1C351.9 96.4 287.5 32 208 32l-48 0C80.5 32 16 96.5 16 176S80.5 320 160 320l48 0zm80-144c0 44.2-35.8 80-80 80l-48 0c-44.2 0-80-35.8-80-80s35.8-80 80-80l48 0c44.2 0 80 35.8 80 80z"
        />
      </svg>
    ),
  };
  return icons[icon];
};
