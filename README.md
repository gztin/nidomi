# Findhouse

Findhouse 是一個以台灣長期租屋為核心的資訊服務。現階段先以單一房源 MVP 驗證「房源介紹、Email 驗證、申請約看、房源提供者確認與通知」流程；未來再擴充為多房源平台。

目前先在本機開發，架構需可移植到 Cloudflare Workers。正式環境預計使用 D1 保存資料、R2 分區保存公開房源圖片與私人驗證文件，並串接交易型 Email 服務。

## 文件索引

- [換機與本機啟動指南](docs/LOCAL_MIGRATION_GUIDE.md)
- [nidomi 品牌文案與平台描述](docs/BRAND_COPY.md)
- [單一房源 MVP 規格](docs/MVP_SPEC.md)
- [頁面與資訊架構](docs/INFORMATION_ARCHITECTURE.md)
- [技術架構](docs/TECHNICAL_ARCHITECTURE.md)
- [資料模型與權限](docs/DATA_MODEL.md)
- [房源欄位與刊登規則](docs/PROPERTY_FIELDS.md)
- [服務條款草案](docs/TERMS_OF_SERVICE.md)
- [隱私權政策草案](docs/PRIVACY_POLICY.md)
- [會員與平台使用規則](docs/MEMBER_RULES.md)
- [核心頁面規格](docs/SCREEN_SPEC.md)
- [使用者流程](docs/USER_FLOWS.md)
- [共用元件清單](docs/COMPONENT_INVENTORY.md)
- [未來完整產品藍圖](docs/PRODUCT_SPEC.md)

## 目前產品邊界

MVP 提供：

- 單一房源資訊與照片展示
- Email 註冊、驗證、登入及密碼重設
- 選擇性上傳所有權文件供平台內部審核；公開頁只顯示會員標章
- 房源提供者設定可約看時段，租客選擇一個時段
- 房源提供者確認、取消及完成約看
- 租客查看或取消自己的約看
- 站內與電子郵件通知
- 會員可同時作為找房者與房源提供者
- 管理員可管理全站會員、房源、預約與文件審核

MVP 暫不提供：

- 多房源刊登、列表、搜尋、篩選及地圖
- 手機 OTP 與會員身分驗證
- 仲介、議價或代替雙方做成交易
- 租金及押金代收付
- 看房後承租意願、優先簽約及候補
- 契約產生、簽署或影像備份
- 公開的房東或房客好壞評分
- 完整租後物業管理

> 本文件是產品規格草案，不是法律意見。正式上線前，服務條款、隱私權政策、文件蒐集方式及不動產相關流程應交由台灣執業律師確認。
