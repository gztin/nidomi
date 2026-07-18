# Findhouse MVP 資料模型與權限

- 更新日期：2026-07-11
- 資料庫目標：Cloudflare D1

## 1. 核心資料關係

```text
users 1 ── 1 profiles
users 1 ── N sessions
users 1 ── N email_tokens
users 1 ── N user_consents
policy_versions 1 ── N user_consents
users 1 ── N viewing_requests
users 1 ── N properties
users 1 ── N identity_verification_submissions
identity_verification_submissions 1 ── N identity_documents
identity_verification_submissions 1 ── N identity_verification_reviews
identity_documents 1 ── N identity_document_access_logs
properties 1 ── N property_images
properties 1 ── N property_fees
properties 1 ── N property_equipment
properties 1 ── N property_versions
properties 1 ── N property_document_submissions
property_document_submissions 1 ── N property_documents
property_document_submissions 1 ── N document_reviews
property_documents 1 ── N document_access_logs
properties 1 ── N viewing_slots
properties 1 ── N viewing_requests
viewing_slots 1 ── N viewing_requests（同時最多一筆有效）
viewing_requests 1 ── N viewing_status_events
viewing_requests 1 ── N viewing_meeting_detail_events
users 1 ── N notifications
notifications 1 ── N email_deliveries
users 1 ── N admin_audit_logs
```

雖然 MVP 只有一筆房源，約看與圖片仍保存 `property_id`，避免未來擴充時遷移核心關係。

## 2. 資料表摘要

### users

- `id`
- `email_normalized`（唯一）
- `password_hash`
- `email_verified_at`
- `role`：`member`、`admin`
- `can_review_documents`（僅由系統設定）
- `terms_version`、`terms_accepted_at`
- `privacy_version`、`privacy_accepted_at`
- `created_at`、`updated_at`、`disabled_at`

`terms_version` 與 `privacy_version` 可作為目前有效版本快取；完整同意歷程以 `user_consents` 為準。正式實作亦需保存會員規則版本。

### profiles

- `user_id`
- `display_name`
- `phone`（未驗證）
- `legal_name`（僅本人與具審核權限管理員可見）
- `created_at`、`updated_at`

### identity_verification_submissions

- `id`、`user_id`、`version_number`
- `status`：`pending`、`changes_requested`、`approved`、`rejected`、`revoked`
- `notice_version`
- `submitted_at`、`reviewed_at`、`revoked_at`

補件建立新版本，不覆蓋原始提交。會員同時最多只有一筆待審或已通過的有效提交。

### identity_documents

- `id`、`submission_id`
- `document_side`：`front`、`back`
- `r2_object_key`（唯一且不得包含姓名、證號或原始檔名）
- `mime_type`、`byte_size`、`content_hash`
- `created_at`、`deleted_at`

文件存放於私人 R2，前台及公開 API 不得回傳永久物件網址。

### identity_verification_reviews

- `id`、`submission_id`、`reviewer_user_id`
- `decision`：`approved`、`changes_requested`、`rejected`、`revoked`
- `reason_code`、`reason_detail`、`created_at`

審核結果新增紀錄而不覆蓋歷程。Email 與身分審核皆通過後，會員取得綠色標章。

### identity_document_access_logs

- `id`、`document_id`、`actor_user_id`
- `action`：`preview`、`download`
- `purpose`、`created_at`

一般會員不得修改存取紀錄；管理員預覽或下載前必須提供審核用途。

### sessions

- `id`
- `user_id`
- `token_hash`
- `expires_at`
- `created_at`、`revoked_at`

### email_tokens

- `id`
- `user_id`
- `purpose`：`verify_email`、`reset_password`
- `token_hash`
- `expires_at`
- `used_at`
- `created_at`

### policy_versions

- `id`
- `policy_type`：`terms`、`privacy`、`member_rules`、`document_notice`
- `version`
- `published_at`、`effective_at`
- `requires_reconsent`
- `content_hash`
- `created_at`

同類型版本字串唯一，已發布內容不得就地覆寫；修正必須建立新版本。

### user_consents

- `id`
- `user_id`
- `policy_version_id`
- `accepted_at`
- `source`：`registration`、`reconsent`、`document_upload`
- `withdrawn_at`（僅適用可撤回的同意）
- `created_at`

同意紀錄不得由一般會員修改。不同法律依據與必要服務不應全部錯誤設計成可任意撤回的單一同意。

### properties

- `id`
- `provider_user_id`
- `slug`（唯一）
- `status`：`draft`、`published`、`unpublished`
- `title`、`summary`、`description`
- `property_type`、`rental_scope`
- `monthly_rent`
- `deposit_amount`
- `payment_cycle`、`payment_due_rule`
- `layout`、`area_ping`、`floor_label`
- `total_floors`、`has_elevator`
- `parking_type`、`parking_description`
- `available_from`
- `minimum_lease_months`
- `viewing_requirement`：`email_verified`、`identity_verified`
- `public_location`、`private_address`
- `electricity_billing_type`：`metered`、`non_metered`、`included`
- `has_independent_electric_meter`
- `electricity_calculation_rule`、`electricity_information_method`
- `common_electricity_rule`
- `water_billing_rule`、`gas_billing_rule`
- `transportation`
- `pets_policy`、`cooking_policy`、`smoking_policy`
- `maximum_occupants`、`sublease_policy`
- `repair_policy`、`known_defects`
- `safety_and_special_facilities`
- `listing_rules_version`
- `created_at`、`updated_at`、`published_at`

公開查詢不得回傳 `private_address`。

`provider_user_id` 表示建立並管理房源的一般會員。同一會員可同時建立自己的房源，也可預約其他會員的房源；不得預約自己的房源。

`viewing_requirement` 預設為 `email_verified`。變更只影響新的預約申請，既有預約不得因此自動取消；每次變更寫入 `property_viewing_requirement_events`。

`deposit_amount` 不得超過 `monthly_rent × 2`。電費欄位依 `electricity_billing_type` 進行條件式驗證；禁止內容不能只由前端阻擋。

### property_fees

- `id`
- `property_id`
- `fee_type`：`management`、`parking`、`water`、`electricity`、`gas`、`internet`、`cable_tv`、`other`
- `name`
- `amount`（可為空）
- `calculation_rule`
- `billing_cycle`
- `paid_by`：`provider`、`tenant`、`shared`
- `is_public`
- `created_at`、`updated_at`

每筆費用必須提供固定金額或明確計算方式，不得只保存「另計」。

### property_equipment

- `id`
- `property_id`
- `equipment_type`
- `name`
- `quantity`
- `condition`
- `usage_scope`：`private`、`shared`
- `note`
- `created_at`、`updated_at`

設備資料需可沿用至未來點交附件；已知故障或缺陷不得標示為正常。

### property_versions

- `id`
- `property_id`
- `version_number`
- `snapshot_json`
- `changed_by_user_id`
- `change_reason`
- `created_at`

租金、押金、費用、電費、租賃範圍、可入住日期、重要設備、已知瑕疵或使用限制變更時建立版本。若已有有效預約，另建立通知並讓預約者查看預約時版本與最新版本差異。

### property_images

- `id`
- `property_id`
- `r2_object_key`（唯一）
- `mime_type`、`byte_size`、`width`、`height`
- `alt_text`
- `sort_order`
- `is_cover`
- `created_at`、`deleted_at`

同一房源最多一張有效封面。刪除採何種補償或軟刪除策略，在實作前以 R2 與資料庫一致性為準定案。

### property_document_submissions

- `id`
- `property_id`
- `submitted_by_user_id`
- `version_number`
- `status`：`pending`、`approved`、`changes_requested`、`expired`、`revoked`
- `relationship_note`（權利人與提供者不一致時使用）
- `submitted_at`、`reviewed_at`、`expired_at`、`revoked_at`

同一房源同時最多一筆 `pending` 或 `approved` 提交。補件建立新版本，舊版本及審核歷程不得覆蓋。

### property_documents

- `id`
- `submission_id`
- `r2_object_key`（唯一）
- `document_type`
- `mime_type`、`byte_size`、`page_count`
- `content_hash`（協助辨識重複檔案）
- `created_at`、`deleted_at`

`r2_object_key` 不得包含姓名、地址或原始檔名；文件位於私人 R2 bucket。

### document_reviews

- `id`
- `submission_id`
- `reviewer_user_id`
- `decision`：`approved`、`changes_requested`、`expired`、`revoked`
- `reason_code`、`reason_detail`
- `created_at`

審核者不可等於 `submitted_by_user_id`。每次決定新增一筆紀錄，不覆蓋先前結果。

### document_access_logs

- `id`
- `document_id`
- `actor_user_id`
- `action`：`preview`、`download`
- `purpose`
- `created_at`

公開房源頁不得查詢或回傳此表及原始文件資訊。

### viewing_slots

- `id`
- `property_id`
- `start_at`、`end_at`
- `status`：`available`、`held`、`confirmed`、`closed`
- `created_by_user_id`
- `held_at`、`confirmed_at`、`closed_at`
- `created_at`、`updated_at`

結束時間固定為開始時間加 60 分鐘。時段只能建立在未來 30 天內，有效時段不可互相重疊；距開始不足 12 小時的時段不可再申請。`held` 代表已有待確認申請，其他會員不可再選擇。

### viewing_requests

- `id`
- `reference_code`（唯一、不可修改的預約編號）
- `property_id`
- `viewing_slot_id`（同一時段同時最多一筆有效申請）
- `requester_user_id`
- `phone_snapshot`
- `party_size`
- `note`
- `contact_name`
- `contact_method`
- `meeting_location`
- `meeting_instructions`
- `meeting_details_updated_at`、`meeting_details_updated_by_user_id`
- `status`：`pending`、`confirmed`、`cancelled`、`completed`
- `confirmation_deadline_at`
- `auto_cancelled_at`
- `cancelled_by_user_id`、`cancellation_reason`
- `created_at`、`updated_at`、`cancelled_at`、`completed_at`

電話以申請當下快照保存，日後會員修改電話不應改變既有申請紀錄。

`reference_code` 使用不可推測的隨機英數格式，不包含會員 ID、電話、日期或連續流水資訊。它只供雙方辨識預約，不得用於授權或公開查詢。

碰面資訊在確認預約時寫入，其中聯絡人姓名、聯絡方式與碰面地點必填。待確認期間不得提供給找房者；確認後只有找房者、房源提供者與管理員可讀取。

### viewing_meeting_detail_events

- `id`
- `viewing_request_id`
- `changed_by_user_id`
- `changed_fields_json`
- `previous_values_json`
- `new_values_json`
- `created_at`

只有已確認且尚未取消或完成的預約可修改碰面資訊。歷程屬於私密資料，不得出現在公開查詢或一般日誌。

### viewing_status_events

- `id`
- `viewing_request_id`
- `from_status`、`to_status`
- `actor_user_id`
- `reason`
- `created_at`

### notifications

- `id`
- `recipient_user_id`
- `type`
- `entity_type`、`entity_id`
- `title`、`body`
- `read_at`
- `created_at`

### email_deliveries

- `id`
- `notification_id`（可為空，例如驗證信）
- `recipient_email_snapshot`
- `template_key`
- `provider_message_id`
- `status`：`queued`、`sent`、`failed`
- `failure_code`（不得保存敏感內容）
- `created_at`、`sent_at`、`failed_at`

### admin_audit_logs

- `id`
- `admin_user_id`
- `action`
- `entity_type`、`entity_id`
- `reason`
- `metadata_json`（不得包含密碼、token、session 或服務金鑰）
- `created_at`

管理員查看敏感文件、修改會員／房源／預約、審核文件或停權時必須新增稽核紀錄，一般會員不得修改。

### moderation_cases

- `id`
- `case_type`：`report`、`appeal`、`security`、`legal_request`
- `reporter_user_id`（可為空）
- `subject_type`、`subject_id`
- `status`：`open`、`reviewing`、`resolved`、`dismissed`
- `reason_code`、`description`
- `assigned_admin_user_id`
- `resolution`、`resolved_at`
- `created_at`、`updated_at`

檢舉、申訴及管理處置需能互相關聯並保留最小必要紀錄；不得將敏感證據放入一般日誌。

## 3. 權限矩陣

| 資源 | 訪客 | 一般會員 | 管理員 |
|---|---|---|---|
| 公開房源欄位 | 讀取 | 讀取；自己的可修改 | 讀取／修改全部 |
| 私密地址 | 無 | 只讀／修改自己的 | 讀取／修改全部 |
| 房源圖片 | 讀取 | 管理自己的 | 管理全部 |
| 房源費用、設備與公開現況 | 讀取 | 管理自己的 | 管理全部 |
| 房源完整門牌與支付資料 | 無 | 管理自己的 | 讀取／管理全部 |
| 房源版本 | 無 | 讀取自己的 | 讀取全部 |
| 公開驗證狀態 | 讀取 | 讀取 | 讀取 |
| 自己提交的所有權文件 | 無 | 依房源所有權限上傳／讀取 | 讀取全部 |
| 他人提交的所有權文件 | 無 | 無 | 僅具審核權限者讀取／審核 |
| 可約時段 | 只讀可預約時段 | 讀取；管理自己房源時段 | 管理全部 |
| 自己的會員資料 | 無 | 讀取／修改 | 讀取自己的資料 |
| 自己的身分驗證提交 | 無 | 建立／讀取狀態；受控預覽自己的文件 | 僅具審核權限者讀取／審核 |
| 他人的身分文件 | 無 | 無 | 僅具審核權限者受控預覽 |
| 自己提出的約看 | 無 | 建立／讀取／取消 | 讀取／處理全部 |
| 自己房源收到的約看 | 無 | 讀取／確認／取消／完成 | 讀取／處理全部 |
| 碰面資訊 | 無 | 僅預約雙方於確認後讀取；房源提供者可修改 | 讀取／修改全部 |
| 通知 | 無 | 只讀自己的 | 只讀自己的及查看寄送狀態 |
| 角色設定 | 無 | 無 | 第一版不在介面開放 |
| 政策與同意歷程 | 無 | 只讀自己的 | 讀取全部；政策版本由授權管理員發布 |
| 檢舉與申訴 | 無 | 建立／查看自己的 | 處理全部 |

## 4. 狀態轉換規則

允許：

- `pending → confirmed`
- `pending → cancelled`
- `confirmed → cancelled`
- `confirmed → completed`

禁止：

- 從 `cancelled` 或 `completed` 返回其他狀態
- 沒有有效關聯時段就建立約看或進入 `confirmed`
- 未驗證 Email 的會員建立約看
- 會員預約自己提供的房源
- 距時段開始不足 12 小時仍建立申請
- 建立互相重疊的有效時段
- 對非 `available` 時段建立申請
- 同一時段存在兩筆有效申請

身分驗證不是預約門檻。綠色標章必須同時滿足 Email 已驗證與最新身分提交為 `approved`；補件、拒絕或撤銷後不得繼續顯示綠色標章。

建立申請時，必須在同一交易中產生唯一預約編號、計算 `confirmation_deadline_at`、將 `viewing_slots` 從 `available` 改為 `held` 並新增 `viewing_requests`。確認期限取申請後 24 小時與時段開始前 6 小時兩者較早者。

確認時必須同時寫入必填碰面資訊，並在同一交易將預約與時段改為 `confirmed`。取消時，同一交易取消預約；若仍距開始至少 12 小時，時段改回 `available`，否則改為 `closed`。租客在不足 12 小時時不得自行取消，房源提供者與系統仍可取消。每次預約狀態轉換同時新增 `viewing_status_events`。

排程工作只處理 `status = pending` 且已超過 `confirmation_deadline_at` 的預約，寫入固定系統原因及 `auto_cancelled_at`。更新必須使用條件式交易或等效機制，確保重複執行只成功一次。

## 5. 資料保存原則

- Email token 到期或使用後不可再次使用，並定期清理。
- 登入 session 可撤銷並具有到期時間。
- 約看與狀態事件保存期限需在隱私政策完成前定案。
- 刪除會員時，需先定義約看稽核紀錄如何匿名化或依法保存。
- 圖片刪除需處理 D1 與 R2 操作部分失敗的補償流程。
- 所有權文件需依隱私權政策設定保存期限；刪除或撤銷不得抹除必要的審核稽核紀錄。
- 文件預覽、下載與審核存取紀錄只能由系統寫入，一般會員不得修改。
- 時間統一以 UTC 保存，介面以 Asia/Taipei 顯示。
