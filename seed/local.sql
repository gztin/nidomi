INSERT OR IGNORE INTO users (id, email_normalized, password_hash, email_verified_at, role)
VALUES ('user-provider-demo', 'provider@example.com', 'LOCAL_DEMO_NOT_A_REAL_PASSWORD_HASH', CURRENT_TIMESTAMP, 'member');

INSERT OR IGNORE INTO profiles (user_id, display_name, phone)
VALUES ('user-provider-demo', '示範房源提供者', '0900000000');

INSERT OR IGNORE INTO properties (
  id, provider_user_id, slug, status, title, summary, description, property_type, rental_scope,
  monthly_rent, deposit_amount, payment_cycle, payment_due_rule, layout, area_ping, floor_label,
  total_floors, has_elevator, public_location, private_address, available_from, minimum_lease_months,
  electricity_billing_type, electricity_calculation_rule, electricity_information_method,
  listing_rules_version, published_at
) VALUES (
  'property-demo-001', 'user-provider-demo', 'sunny-one-bedroom', 'published',
  '採光一房一廳，步行可達捷運', '面向安靜巷弄，適合一至兩人長期居住。',
  '本資料僅供本機 MVP 測試。', '整層住家', '整戶', 22000, 44000, 'monthly',
  '每月 5 日前', '1 房 1 廳 1 衛', 15.8, '5 樓／共 8 樓', 8, 1,
  '台北市中山區・近捷運行天宮站', '台北市中山區測試路 1 號 5 樓', '2026-08-01', 12,
  'metered', '依台電帳單當期每度平均電價', '每期提供帳單資訊',
  'MOI-RENTAL-2026-07', CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO property_fees (id, property_id, fee_type, name, amount, calculation_rule, billing_cycle, paid_by)
VALUES
  ('fee-management', 'property-demo-001', 'management', '管理費', 1500, NULL, 'monthly', 'tenant'),
  ('fee-electricity', 'property-demo-001', 'electricity', '電費', NULL, '依台電帳單當期每度平均電價', 'billing_period', 'tenant'),
  ('fee-water', 'property-demo-001', 'water', '水費', NULL, '依自來水帳單', 'billing_period', 'tenant');

UPDATE properties
SET
  rental_conditions_text = '可開伙
室內禁菸
寵物需先討論
最多 2 人
最短租期 12 個月
可申請租金補貼',
  known_conditions_text = '浴室無對外窗，設有抽風設備
無車位
房源位於住宅區，晚間請降低音量',
  nearby_text = '行天宮站步行約 7 分鐘
超商步行約 2 分鐘
傳統市場步行約 6 分鐘'
WHERE id = 'property-demo-001';

INSERT OR IGNORE INTO property_equipment (id, property_id, equipment_type, name, quantity, condition, usage_scope)
VALUES
  ('equipment-ac', 'property-demo-001', 'appliance', '冷氣 2 台', 1, '可使用', 'private'),
  ('equipment-fridge', 'property-demo-001', 'appliance', '冰箱', 1, '可使用', 'private'),
  ('equipment-washer', 'property-demo-001', 'appliance', '洗衣機', 1, '可使用', 'private'),
  ('equipment-bed', 'property-demo-001', 'furniture', '雙人床', 1, '可使用', 'private'),
  ('equipment-wardrobe', 'property-demo-001', 'furniture', '衣櫃', 1, '可使用', 'private'),
  ('equipment-heater', 'property-demo-001', 'appliance', '熱水器', 1, '可使用', 'private'),
  ('equipment-elevator', 'property-demo-001', 'building', '電梯', 1, '可使用', 'shared');

UPDATE properties
SET provider_user_id = 'user-admin-test',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'property-demo-001'
  AND EXISTS (SELECT 1 FROM users WHERE id = 'user-admin-test');

INSERT OR IGNORE INTO property_listing_tags (property_id, tag_id)
VALUES
  ('property-demo-001', 'tag-item-fridge'),
  ('property-demo-001', 'tag-item-ac'),
  ('property-demo-001', 'tag-item-washer'),
  ('property-demo-001', 'tag-item-water-heater'),
  ('property-demo-001', 'tag-item-wardrobe'),
  ('property-demo-001', 'tag-item-bed'),
  ('property-demo-001', 'tag-item-elevator'),
  ('property-demo-001', 'tag-service-manager-package');
