CREATE TABLE listing_tags (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('rule', 'item', 'service')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  disabled_at TEXT,
  UNIQUE (category, slug),
  UNIQUE (category, name)
);

CREATE TABLE property_listing_tags (
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES listing_tags(id),
  quantity INTEGER,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (property_id, tag_id)
);

CREATE INDEX idx_listing_tags_category_active
ON listing_tags(category, disabled_at, sort_order, name);

CREATE INDEX idx_property_listing_tags_tag
ON property_listing_tags(tag_id);

INSERT INTO listing_tags(id,category,name,slug,sort_order) VALUES
  ('tag-item-ac','item','冷氣','item-ac',10),
  ('tag-item-fridge','item','冰箱','item-fridge',20),
  ('tag-item-washer','item','洗衣機','item-washer',30),
  ('tag-item-tv','item','電視','item-tv',40),
  ('tag-item-water-heater','item','熱水器','item-water-heater',50),
  ('tag-item-bed','item','床','item-bed',60),
  ('tag-item-wardrobe','item','衣櫃','item-wardrobe',70),
  ('tag-item-sofa','item','沙發','item-sofa',80),
  ('tag-item-internet','item','網路','item-internet',90),
  ('tag-item-gas','item','天然瓦斯','item-gas',100),
  ('tag-item-elevator','item','電梯','item-elevator',110),
  ('tag-item-parking','item','車位','item-parking',120),
  ('tag-item-trash','item','垃圾集中處理','item-trash',130),
  ('tag-item-desk-chair','item','桌椅','item-desk-chair',140),
  ('tag-item-balcony','item','陽台','item-balcony',150),
  ('tag-item-cable-tv','item','第四台','item-cable-tv',160),
  ('tag-item-water-dispenser','item','飲水機','item-water-dispenser',170),
  ('tag-item-microwave','item','微波爐','item-microwave',180),
  ('tag-item-stove','item','瓦斯爐','item-stove',190),
  ('tag-item-range-hood','item','抽油煙機','item-range-hood',200),
  ('tag-rule-no-smoking','rule','室內禁菸','rule-no-smoking',10),
  ('tag-rule-cook','rule','可開伙','rule-cook',20),
  ('tag-rule-no-pets','rule','不可養寵物','rule-no-pets',30),
  ('tag-service-security','service','保全設施','service-security',10),
  ('tag-service-access-control','service','門禁管理','service-access-control',20),
  ('tag-service-package','service','包裹代收','service-package',30),
  ('tag-service-manager-package','service','管理員代收','service-manager-package',40),
  ('tag-service-trash','service','垃圾代收','service-trash',50);
