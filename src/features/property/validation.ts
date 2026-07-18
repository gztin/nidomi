import type { PropertyDetail } from "./types";

export function validatePropertyForPublishing(property: PropertyDetail): string[] {
  const errors: string[] = [];

  if (property.monthlyRent <= 0) errors.push("每月租金必須大於 0");
  if (property.depositAmount < 0) errors.push("押金不得小於 0");
  if (property.depositAmount > property.monthlyRent * 2) errors.push("押金不得超過兩個月租金");
  if (!property.publicLocation.trim()) errors.push("公開位置為必填");
  if (property.fees.some((fee) => !fee.value.trim() || fee.value.trim() === "另計")) {
    errors.push("每項費用必須提供金額或明確計算方式");
  }

  return errors;
}
