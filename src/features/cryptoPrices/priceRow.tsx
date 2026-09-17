import { memo } from "react";

type PriceRowProps = {
  symbol: string;
  price?: string;
};

export const PriceRow = memo(({ symbol, price }: PriceRowProps) => {
  return (
    <div>
      <strong>{symbol}</strong>
      <span> {price ?? "---"}</span>
    </div>
  );
});
