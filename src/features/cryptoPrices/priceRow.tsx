import { memo } from "react";
import type { PriceData } from "./types";

type PriceRowProps = {
  symbol: string;
  data?: PriceData;
};

export const PriceRow = memo(function PriceRow({
  symbol,
  data,
}: PriceRowProps) {
  const directionLabel =
    data?.direction === "up"
      ? "price increased"
      : data?.direction === "down"
        ? "price decreased"
        : "";

  return (
    <tr>
      <th scope="row">{symbol}</th>

      <td className={`price price--${data?.direction ?? "same"}`}>
        {data ? Number(data.price).toFixed(4) : "---"}

        {data?.direction !== "same" && (
          <>
            {" "}
            <span aria-hidden="true">
              {data?.direction === "up" ? "↑" : "↓"}
            </span>
            <span className="sr-only">{directionLabel}</span>
          </>
        )}
      </td>
    </tr>
  );
});
