import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { ListingTagCreateDialog } from "@/components/admin/listing-tag-create-dialog";
import { ListingTagEditDialog } from "@/components/admin/listing-tag-edit-dialog";
import { SuccessDialog } from "@/components/admin/success-dialog";
import { requireManager } from "@/features/admin/access";
import { getDb } from "@/features/auth/db";
import { getManageableListingTags, isListingTagCategory, listingTagCategoryLabel } from "@/features/property/listing-tags";

const PAGE_SIZE = 10;

const successStatusMessages: Record<string, { title: string; body: string }> = {
  created: { title: "新增成功", body: "房源編輯頁會使用最新的公版標籤清單。" },
  saved: { title: "更新成功", body: "已同步更新公版標籤名稱與分類。" },
  deleted: { title: "刪除成功", body: "未被房源使用的標籤已從公版清單移除。" },
  disabled: { title: "停用成功", body: "已被房源使用的標籤會保留既有關聯，但不再提供新增選用。" },
  enabled: { title: "啟用成功", body: "房源編輯頁可再次選用這個標籤。" },
};

const errorStatusMessages: Record<string, { title: string; body: string; tone: string }> = {
  duplicate: { title: "標籤重複", body: "同分類中已有相同或相近代碼的標籤，請調整名稱。", tone: "rejected" },
  invalid: { title: "無法儲存", body: "請確認分類與名稱。", tone: "rejected" },
};

const filters = [
  { label: "所有", href: "/admin/listing-tags" },
  { label: "設備", href: "/admin/listing-tags?category=item" },
  { label: "規則", href: "/admin/listing-tags?category=rule" },
  { label: "服務", href: "/admin/listing-tags?category=service" },
];

function paginationHref({ category, q, page }: { category: string; q: string; page: number }) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin/listing-tags?${query}` : "/admin/listing-tags";
}

export default async function ListingTagsPage({ searchParams }: { searchParams: Promise<{ status?: string; category?: string; q?: string; page?: string }> }) {
  const manager = await requireManager();
  const { status, category, q, page } = await searchParams;
  const selectedCategory = category && isListingTagCategory(category) ? category : "";
  const keyword = (q ?? "").trim();
  const currentPage = Math.max(1, Number(page ?? "1") || 1);
  const allTags = await getManageableListingTags(await getDb());
  const filteredByCategory = selectedCategory ? allTags.filter((tag) => tag.category === selectedCategory) : allTags;
  const filteredTags = keyword ? filteredByCategory.filter((tag) => tag.name.includes(keyword)) : filteredByCategory;
  const totalPages = Math.max(1, Math.ceil(filteredTags.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const tags = filteredTags.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const successMessage = status ? successStatusMessages[status] : null;
  const errorMessage = status ? errorStatusMessages[status] : null;

  return <AdminShell name={manager.displayName} title="標籤管理" eyebrow="公版資料">
    {successMessage && <SuccessDialog title={successMessage.title} body={successMessage.body}/>}
    {errorMessage && <div className={`status-card status-${errorMessage.tone}`}><strong>{errorMessage.title}</strong><p>{errorMessage.body}</p></div>}
    <section className="admin-panel">
      <div className="tag-admin-titlebar">
        <h2>公版標籤清單</h2>
        <ListingTagCreateDialog />
      </div>
      <nav className="tag-filter-tabs" aria-label="標籤類型篩選">
        {filters.map((filter) => {
          const isCurrent = filter.href === "/admin/listing-tags" ? !selectedCategory : filter.href.endsWith(`=${selectedCategory}`);
          return <Link className={isCurrent ? "is-current" : ""} href={filter.href} key={filter.href}>{filter.label}</Link>;
        })}
      </nav>
      <form className="tag-search-form" action="/admin/listing-tags">
        {selectedCategory ? <input type="hidden" name="category" value={selectedCategory}/> : null}
        <input name="q" defaultValue={keyword} placeholder="搜尋標籤名稱"/>
        <button className="button button-secondary" type="submit">搜尋</button>
        {keyword ? <Link className="button button-secondary" href={paginationHref({ category: selectedCategory, q: "", page: 1 })}>清除</Link> : null}
      </form>
      <p className="admin-result-summary">共 {filteredTags.length} 筆，頁次 {safePage} / {totalPages}</p>
      <div className="tag-admin-list">
        <div className="tag-admin-header" aria-hidden="true">
          <span>類別</span>
          <span>名稱</span>
          <span>操作</span>
        </div>
        {tags.length ? tags.map((tag) => (
          <div className={`tag-admin-row${tag.disabledAt ? " is-disabled" : ""}`} key={tag.id}>
            <span>{listingTagCategoryLabel(tag.category)}</span>
            <strong>{tag.name}</strong>
            <div className="tag-admin-actions">
              <ListingTagEditDialog tag={tag}/>
              {tag.disabledAt ? (
                <form action={`/api/admin/listing-tags/${tag.id}`} method="post">
                  <button className="tag-text-button" name="intent" value="toggle" type="submit">啟用</button>
                </form>
              ) : (
                <form action={`/api/admin/listing-tags/${tag.id}`} method="post">
                  <ConfirmSubmitButton className="tag-text-button" name="intent" value="toggle" message={`確定要停用「${tag.name}」嗎？`}>停用</ConfirmSubmitButton>
                </form>
              )}
              <form action={`/api/admin/listing-tags/${tag.id}`} method="post">
                <ConfirmSubmitButton className="tag-delete-button" name="intent" value="delete" message={`確定要刪除「${tag.name}」嗎？若已被房源使用，系統會改為停用。`}>刪除</ConfirmSubmitButton>
              </form>
            </div>
          </div>
        )) : <p>尚未建立公版標籤。請先套用資料庫 migration。</p>}
      </div>
      <nav className="admin-pagination" aria-label="標籤分頁">
        <Link className={safePage === 1 ? "is-disabled" : ""} href={paginationHref({ category: selectedCategory, q: keyword, page: 1 })}>第一頁</Link>
        <Link className={safePage === 1 ? "is-disabled" : ""} href={paginationHref({ category: selectedCategory, q: keyword, page: Math.max(1, safePage - 1) })}>上一頁</Link>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
          <Link className={pageNumber === safePage ? "is-current" : ""} href={paginationHref({ category: selectedCategory, q: keyword, page: pageNumber })} key={pageNumber}>{pageNumber}</Link>
        ))}
        <Link className={safePage === totalPages ? "is-disabled" : ""} href={paginationHref({ category: selectedCategory, q: keyword, page: Math.min(totalPages, safePage + 1) })}>下一頁</Link>
        <Link className={safePage === totalPages ? "is-disabled" : ""} href={paginationHref({ category: selectedCategory, q: keyword, page: totalPages })}>最末頁</Link>
      </nav>
    </section>
  </AdminShell>;
}
