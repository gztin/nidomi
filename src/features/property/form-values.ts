export function parseLayoutParts(layout?: string) {
  return {
    bedrooms: parseMatchedNumber(layout, /(\d+)\s*房/),
    livingRooms: parseMatchedNumber(layout, /(\d+)\s*廳/),
    bathrooms: parseMatchedNumber(layout, /(\d+)\s*衛/),
  };
}

export function parseFloorNumber(floorLabel?: string) {
  return parseMatchedNumber(floorLabel, /(-?\d+)\s*樓/);
}

export function composeLayout(bedrooms: number, livingRooms: number, bathrooms: number) {
  return `${bedrooms} 房 ${livingRooms} 廳 ${bathrooms} 衛`;
}

export function composeFloorLabel(floorNumber: number) {
  return `${floorNumber} 樓`;
}

export function parseMultilineText(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

export function joinMultilineText(items: Array<string | null | undefined>) {
  return items.map((item) => item?.trim() ?? "").filter(Boolean).join("\n");
}

function parseMatchedNumber(value: string | undefined, pattern: RegExp) {
  const matched = value?.match(pattern)?.[1];
  return matched === undefined ? undefined : Number(matched);
}
