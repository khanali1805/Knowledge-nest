import {
  getPaginatedPublishedArticlesByCategory,
  getPublishedCategories,
  searchPaginatedPublishedArticles,
} from "../src/lib/queries/article-queries";
async function main() {
  const categories = await getPublishedCategories();
  const firstCategory = categories[0] ?? null;
  const categoryPagination = firstCategory
    ? await getPaginatedPublishedArticlesByCategory(firstCategory.id, 999, 1)
    : null;
  const searchPagination = await searchPaginatedPublishedArticles("a", 999, 1);
  if (categoryPagination) {
    if (categoryPagination.page < 1) {
      throw new Error("Category pagination returned an invalid page.");
    }
    if (categoryPagination.page > categoryPagination.totalPages) {
      throw new Error("Category pagination exceeded total pages.");
    }
    if (categoryPagination.articles.length > categoryPagination.pageSize) {
      throw new Error("Category pagination exceeded its page size.");
    }
  }
  if (searchPagination.page < 1) {
    throw new Error("Search pagination returned an invalid page.");
  }
  if (searchPagination.page > searchPagination.totalPages) {
    throw new Error("Search pagination exceeded total pages.");
  }
  if (searchPagination.articles.length > searchPagination.pageSize) {
    throw new Error("Search pagination exceeded its page size.");
  }
  console.log(
    JSON.stringify(
      {
        categoryPagination,
        searchPagination: {
          total: searchPagination.total,
          page: searchPagination.page,
          pageSize: searchPagination.pageSize,
          totalPages: searchPagination.totalPages,
          returnedArticles: searchPagination.articles.length,
        },
      },
      null,
      2,
    ),
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit();
  });
