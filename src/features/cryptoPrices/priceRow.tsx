import { memo } from "react";
import type { PriceData } from "./types";

type PriceRowProps = {
  symbol: string;
  data?: PriceData;
};

export const PriceRow = memo(({ symbol, data }: PriceRowProps) => {
  const { price, direction } = data || {};

  return (
    <div>
      <strong>{symbol}</strong>{" "}
      <span>
        {price ? Number(price).toFixed(2) : "---"}
        {direction === "up" && "↑"}
        {direction === "down" && "↓"}
      </span>
    </div>
  );
});
