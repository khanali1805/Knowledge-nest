import "server-only";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import {
  articleActivityLogs,
  articleEditorPresence,
  articles,
  type ArticleActivityMetadata,
} from "@/db/schema";
const PRESENCE_DURATION_MS = 60 * 1000;
export type ArticleActivityRecord = {
  id: string;
  articleId: string;
  username: string;
  action: string;
  summary: string;
  metadata: ArticleActivityMetadata | null;
  createdAt: Date;
};
export type ArticlePresenceRecord = {
  articleId: string;
  sessionId: string;
  username: string;
  joinedAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
};
export type ArticleActivityFilters = {
  actions?: string[];
  usernames?: string[];
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  sortDirection?: "asc" | "desc";
};
export type ArticleActivityFilterResult = {
  activities: ArticleActivityRecord[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};
export type ArticleActivityDashboard = {
  articleId: string;
  totalActivities: number;
  totalActiveEditors: number;
  uniqueEditors: number;
  latestActivityAt: Date | null;
  actions: Array<{
    action: string;
    count: number;
  }>;
  editors: Array<{
    username: string;
    activityCount: number;
    lastActivityAt: Date;
  }>;
  dailyActivity: Array<{
    date: string;
    count: number;
  }>;
  recentActivities: ArticleActivityRecord[];
  activeEditors: ArticlePresenceRecord[];
};
export type GlobalCollaborationDashboard = {
  totalActivities: number;
  totalActiveEditors: number;
  activeArticles: number;
  uniqueEditors: number;
  recentActivities: Array<
    ArticleActivityRecord & {
      articleTitle: string | null;
      articleSlug: string | null;
    }
  >;
  activePresence: Array<
    ArticlePresenceRecord & {
      articleTitle: string | null;
      articleSlug: string | null;
    }
  >;
  topArticles: Array<{
    articleId: string;
    title: string;
    slug: string;
    activityCount: number;
    lastActivityAt: Date;
  }>;
};
function createPresenceExpiry(): Date {
  return new Date(Date.now() + PRESENCE_DURATION_MS);
}
function normaliseLimit(limit: number | undefined, maximum = 100): number {
  return Math.min(Math.max(Math.trunc(limit ?? 50), 1), maximum);
}
function normaliseOffset(offset: number | undefined): number {
  return Math.max(Math.trunc(offset ?? 0), 0);
}
export async function createArticleActivity({
  articleId,
  username,
  action,
  summary,
  metadata,
}: {
  articleId: string;
  username: string;
  action: string;
  summary: string;
  metadata?: ArticleActivityMetadata;
}): Promise<ArticleActivityRecord> {
  const [createdActivity] = await db
    .insert(articleActivityLogs)
    .values({
      articleId,
      username,
      action,
      summary,
      metadata: metadata ?? null,
    })
    .returning();
  if (!createdActivity) {
    throw new Error("Article activity log create nahi hua.");
  }
  return createdActivity;
}
export async function listArticleActivities({
  articleId,
  limit = 50,
}: {
  articleId: string;
  limit?: number;
}): Promise<ArticleActivityRecord[]> {
  return db
    .select()
    .from(articleActivityLogs)
    .where(eq(articleActivityLogs.articleId, articleId))
    .orderBy(desc(articleActivityLogs.createdAt))
    .limit(normaliseLimit(limit));
}
export async function filterArticleActivities({
  articleId,
  filters = {},
}: {
  articleId: string;
  filters?: ArticleActivityFilters;
}): Promise<ArticleActivityFilterResult> {
  const conditions = [eq(articleActivityLogs.articleId, articleId)];
  const actions = filters.actions?.map((action) => action.trim()).filter(Boolean);
  if (actions && actions.length > 0) {
    conditions.push(inArray(articleActivityLogs.action, actions));
  }
  const usernames = filters.usernames?.map((username) => username.trim()).filter(Boolean);
  if (usernames && usernames.length > 0) {
    conditions.push(inArray(articleActivityLogs.username, usernames));
  }
  const search = filters.search?.trim();
  if (search) {
    conditions.push(
      or(
        ilike(articleActivityLogs.summary, `%${search}%`),
        ilike(articleActivityLogs.action, `%${search}%`),
        ilike(articleActivityLogs.username, `%${search}%`),
      )!,
    );
  }
  if (filters.dateFrom) {
    conditions.push(gte(articleActivityLogs.createdAt, filters.dateFrom));
  }
  if (filters.dateTo) {
    conditions.push(lte(articleActivityLogs.createdAt, filters.dateTo));
  }
  const whereCondition = and(...conditions);
  const limit = normaliseLimit(filters.limit);
  const offset = normaliseOffset(filters.offset);
  const sortDirection = filters.sortDirection === "asc" ? "asc" : "desc";
  const [activities, totalRows] = await Promise.all([
    db
      .select()
      .from(articleActivityLogs)
      .where(whereCondition)
      .orderBy(
        sortDirection === "asc"
          ? asc(articleActivityLogs.createdAt)
          : desc(articleActivityLogs.createdAt),
      )
      .limit(limit)
      .offset(offset),
    db
      .select({
        total: count(),
      })
      .from(articleActivityLogs)
      .where(whereCondition),
  ]);
  const total = Number(totalRows[0]?.total ?? 0);
  return {
    activities,
    total,
    limit,
    offset,
    hasMore: offset + activities.length < total,
  };
}
export async function getArticleActivityFilterOptions(articleId: string): Promise<{
  actions: string[];
  usernames: string[];
}> {
  const [actionRows, usernameRows] = await Promise.all([
    db
      .selectDistinct({
        action: articleActivityLogs.action,
      })
      .from(articleActivityLogs)
      .where(eq(articleActivityLogs.articleId, articleId))
      .orderBy(asc(articleActivityLogs.action)),
    db
      .selectDistinct({
        username: articleActivityLogs.username,
      })
      .from(articleActivityLogs)
      .where(eq(articleActivityLogs.articleId, articleId))
      .orderBy(asc(articleActivityLogs.username)),
  ]);
  return {
    actions: actionRows.map((row) => row.action),
    usernames: usernameRows.map((row) => row.username),
  };
}
export async function cleanupExpiredPresence(articleId?: string): Promise<void> {
  const now = new Date();
  if (articleId) {
    await db
      .delete(articleEditorPresence)
      .where(
        and(
          eq(articleEditorPresence.articleId, articleId),
          lt(articleEditorPresence.expiresAt, now),
        ),
      );
    return;
  }
  await db.delete(articleEditorPresence).where(lt(articleEditorPresence.expiresAt, now));
}
export async function upsertArticlePresence({
  articleId,
  sessionId,
  username,
}: {
  articleId: string;
  sessionId: string;
  username: string;
}): Promise<ArticlePresenceRecord> {
  await cleanupExpiredPresence(articleId);
  const now = new Date();
  const [presence] = await db
    .insert(articleEditorPresence)
    .values({
      articleId,
      sessionId,
      username,
      joinedAt: now,
      lastSeenAt: now,
      expiresAt: createPresenceExpiry(),
    })
    .onConflictDoUpdate({
      target: [articleEditorPresence.articleId, articleEditorPresence.sessionId],
      set: {
        username,
        lastSeenAt: now,
        expiresAt: createPresenceExpiry(),
      },
    })
    .returning();
  if (!presence) {
    throw new Error("Editor presence update nahi hui.");
  }
  return presence;
}
export async function listArticlePresence(
  articleId: string,
): Promise<ArticlePresenceRecord[]> {
  await cleanupExpiredPresence(articleId);
  return db
    .select()
    .from(articleEditorPresence)
    .where(eq(articleEditorPresence.articleId, articleId))
    .orderBy(desc(articleEditorPresence.lastSeenAt));
}
export async function removeArticlePresence({
  articleId,
  sessionId,
  username,
}: {
  articleId: string;
  sessionId: string;
  username: string;
}): Promise<boolean> {
  const deletedRows = await db
    .delete(articleEditorPresence)
    .where(
      and(
        eq(articleEditorPresence.articleId, articleId),
        eq(articleEditorPresence.sessionId, sessionId),
        eq(articleEditorPresence.username, username),
      ),
    )
    .returning({
      sessionId: articleEditorPresence.sessionId,
    });
  return deletedRows.length > 0;
}
export async function getArticleActivityDashboard(
  articleId: string,
): Promise<ArticleActivityDashboard> {
  await cleanupExpiredPresence(articleId);
  const [
    totalRows,
    activeEditors,
    uniqueEditorRows,
    latestRows,
    actionRows,
    editorRows,
    dailyRows,
    recentActivities,
  ] = await Promise.all([
    db
      .select({
        total: count(),
      })
      .from(articleActivityLogs)
      .where(eq(articleActivityLogs.articleId, articleId)),
    listArticlePresence(articleId),
    db
      .select({
        total: sql<number>`
            count(
              distinct
              ${articleActivityLogs.username}
            )
          `,
      })
      .from(articleActivityLogs)
      .where(eq(articleActivityLogs.articleId, articleId)),
    db
      .select({
        createdAt: articleActivityLogs.createdAt,
      })
      .from(articleActivityLogs)
      .where(eq(articleActivityLogs.articleId, articleId))
      .orderBy(desc(articleActivityLogs.createdAt))
      .limit(1),
    db
      .select({
        action: articleActivityLogs.action,
        count: count(),
      })
      .from(articleActivityLogs)
      .where(eq(articleActivityLogs.articleId, articleId))
      .groupBy(articleActivityLogs.action)
      .orderBy(desc(count())),
    db
      .select({
        username: articleActivityLogs.username,
        activityCount: count(),
        lastActivityAt: sql<Date>`
            max(
              ${articleActivityLogs.createdAt}
            )
          `,
      })
      .from(articleActivityLogs)
      .where(eq(articleActivityLogs.articleId, articleId))
      .groupBy(articleActivityLogs.username)
      .orderBy(desc(count()))
      .limit(20),
    db
      .select({
        date: sql<string>`
            to_char(
              date_trunc(
                'day',
                ${articleActivityLogs.createdAt}
              ),
              'YYYY-MM-DD'
            )
          `,
        count: count(),
      })
      .from(articleActivityLogs)
      .where(
        and(
          eq(articleActivityLogs.articleId, articleId),
          gte(
            articleActivityLogs.createdAt,
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          ),
        ),
      )
      .groupBy(
        sql`
          date_trunc(
            'day',
            ${articleActivityLogs.createdAt}
          )
        `,
      )
      .orderBy(
        asc(
          sql`
            date_trunc(
              'day',
              ${articleActivityLogs.createdAt}
            )
          `,
        ),
      ),
    listArticleActivities({
      articleId,
      limit: 10,
    }),
  ]);
  return {
    articleId,
    totalActivities: Number(totalRows[0]?.total ?? 0),
    totalActiveEditors: activeEditors.length,
    uniqueEditors: Number(uniqueEditorRows[0]?.total ?? 0),
    latestActivityAt: latestRows[0]?.createdAt ?? null,
    actions: actionRows.map((row) => ({
      action: row.action,
      count: Number(row.count),
    })),
    editors: editorRows.map((row) => ({
      username: row.username,
      activityCount: Number(row.activityCount),
      lastActivityAt: row.lastActivityAt,
    })),
    dailyActivity: dailyRows.map((row) => ({
      date: row.date,
      count: Number(row.count),
    })),
    recentActivities,
    activeEditors,
  };
}
export async function getGlobalCollaborationDashboard(): Promise<GlobalCollaborationDashboard> {
  await cleanupExpiredPresence();
  const [
    totalActivityRows,
    uniqueEditorRows,
    activePresenceRows,
    activeArticleRows,
    recentActivityRows,
    topArticleRows,
  ] = await Promise.all([
    db
      .select({
        total: count(),
      })
      .from(articleActivityLogs),
    db
      .select({
        total: sql<number>`
            count(
              distinct
              ${articleActivityLogs.username}
            )
          `,
      })
      .from(articleActivityLogs),
    db
      .select({
        articleId: articleEditorPresence.articleId,
        sessionId: articleEditorPresence.sessionId,
        username: articleEditorPresence.username,
        joinedAt: articleEditorPresence.joinedAt,
        lastSeenAt: articleEditorPresence.lastSeenAt,
        expiresAt: articleEditorPresence.expiresAt,
        articleTitle: articles.title,
        articleSlug: articles.slug,
      })
      .from(articleEditorPresence)
      .leftJoin(articles, eq(articles.id, articleEditorPresence.articleId))
      .orderBy(desc(articleEditorPresence.lastSeenAt)),
    db
      .select({
        total: sql<number>`
            count(
              distinct
              ${articleEditorPresence.articleId}
            )
          `,
      })
      .from(articleEditorPresence),
    db
      .select({
        id: articleActivityLogs.id,
        articleId: articleActivityLogs.articleId,
        username: articleActivityLogs.username,
        action: articleActivityLogs.action,
        summary: articleActivityLogs.summary,
        metadata: articleActivityLogs.metadata,
        createdAt: articleActivityLogs.createdAt,
        articleTitle: articles.title,
        articleSlug: articles.slug,
      })
      .from(articleActivityLogs)
      .leftJoin(articles, eq(articles.id, articleActivityLogs.articleId))
      .orderBy(desc(articleActivityLogs.createdAt))
      .limit(50),
    db
      .select({
        articleId: articleActivityLogs.articleId,
        title: articles.title,
        slug: articles.slug,
        activityCount: count(),
        lastActivityAt: sql<Date>`
            max(
              ${articleActivityLogs.createdAt}
            )
          `,
      })
      .from(articleActivityLogs)
      .innerJoin(articles, eq(articles.id, articleActivityLogs.articleId))
      .groupBy(articleActivityLogs.articleId, articles.title, articles.slug)
      .orderBy(desc(count()))
      .limit(20),
  ]);
  return {
    totalActivities: Number(totalActivityRows[0]?.total ?? 0),
    totalActiveEditors: activePresenceRows.length,
    activeArticles: Number(activeArticleRows[0]?.total ?? 0),
    uniqueEditors: Number(uniqueEditorRows[0]?.total ?? 0),
    recentActivities: recentActivityRows,
    activePresence: activePresenceRows,
    topArticles: topArticleRows.map((row) => ({
      articleId: row.articleId,
      title: row.title,
      slug: row.slug,
      activityCount: Number(row.activityCount),
      lastActivityAt: row.lastActivityAt,
    })),
  };
}
