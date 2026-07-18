import { describe, expect, it } from "vitest";
import { demoProperty } from "../../src/data/demo-property";
import { validatePropertyForPublishing } from "../../src/features/property/validation";

describe("validatePropertyForPublishing", () => {
  it("接受符合刊登規則的房源", () => {
    expect(validatePropertyForPublishing(demoProperty)).toEqual([]);
  });

  it("拒絕超過兩個月租金的押金", () => {
    const property = { ...demoProperty, depositAmount: demoProperty.monthlyRent * 2 + 1 };
    expect(validatePropertyForPublishing(property)).toContain("押金不得超過兩個月租金");
  });

  it("拒絕只有『另計』而沒有計算方式的費用", () => {
    const property = { ...demoProperty, fees: [{ name: "其他", value: "另計", note: "" }] };
    expect(validatePropertyForPublishing(property)).toContain("每項費用必須提供金額或明確計算方式");
  });
});
