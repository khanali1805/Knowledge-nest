import "dotenv/config";
import postgres from "postgres";
const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  throw new Error("DATABASE_URL is missing from .env.local.");
}
const sql = postgres(connectionString, {
  prepare: false,
  ssl: "require",
  max: 1,
});
async function main() {
  try {
    await sql`create extension if not exists pgcrypto`;
  await sql`
    create table if not exists articles (
      id uuid primary key default gen_random_uuid(),
      author_id uuid,
      category_id uuid,
      featured_image_id uuid,
      title varchar(255) not null,
      slug varchar(300) not null,
      excerpt text,
      content text not null,
      content_json jsonb,
      status varchar(30) not null default 'draft',
      seo_title varchar(255),
      seo_description text,
      canonical_url text,
      focus_keyword varchar(255),
      reading_time_minutes integer not null default 1,
      view_count integer not null default 0,
      is_featured boolean not null default false,
      scheduled_at timestamptz,
      published_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  await sql`alter table articles add column if not exists author_id uuid`;
  await sql`alter table articles add column if not exists category_id uuid`;
  await sql`alter table articles add column if not exists featured_image_id uuid`;
  await sql`alter table articles add column if not exists title varchar(255)`;
  await sql`alter table articles add column if not exists slug varchar(300)`;
  await sql`alter table articles add column if not exists excerpt text`;
  await sql`alter table articles add column if not exists content text`;
  await sql`alter table articles add column if not exists content_json jsonb`;
  await sql`alter table articles add column if not exists status varchar(30) default 'draft'`;
  await sql`alter table articles add column if not exists seo_title varchar(255)`;
  await sql`alter table articles add column if not exists seo_description text`;
  await sql`alter table articles add column if not exists canonical_url text`;
  await sql`alter table articles add column if not exists focus_keyword varchar(255)`;
  await sql`alter table articles add column if not exists reading_time_minutes integer default 1`;
  await sql`alter table articles add column if not exists view_count integer default 0`;
  await sql`alter table articles add column if not exists is_featured boolean default false`;
  await sql`alter table articles add column if not exists scheduled_at timestamptz`;
  await sql`alter table articles add column if not exists published_at timestamptz`;
  await sql`alter table articles add column if not exists created_at timestamptz default now()`;
  await sql`alter table articles add column if not exists updated_at timestamptz default now()`;
  await sql`update articles set status = 'draft' where status is null`;
  await sql`update articles set reading_time_minutes = 1 where reading_time_minutes is null`;
  await sql`update articles set view_count = 0 where view_count is null`;
  await sql`update articles set is_featured = false where is_featured is null`;
  await sql`update articles set created_at = now() where created_at is null`;
  await sql`update articles set updated_at = now() where updated_at is null`;
  await sql`alter table articles alter column status set default 'draft'`;
  await sql`alter table articles alter column reading_time_minutes set default 1`;
  await sql`alter table articles alter column view_count set default 0`;
  await sql`alter table articles alter column is_featured set default false`;
  await sql`alter table articles alter column created_at set default now()`;
  await sql`alter table articles alter column updated_at set default now()`;
  await sql`alter table articles alter column status set not null`;
  await sql`alter table articles alter column reading_time_minutes set not null`;
  await sql`alter table articles alter column view_count set not null`;
  await sql`alter table articles alter column is_featured set not null`;
  await sql`alter table articles alter column created_at set not null`;
  await sql`alter table articles alter column updated_at set not null`;
  await sql`
    create unique index if not exists articles_slug_unique
    on articles (slug)
  `;
  await sql`
    create index if not exists articles_status_index
    on articles (status)
  `;
  await sql`
    create index if not exists articles_category_index
    on articles (category_id)
  `;
  await sql`
    create index if not exists articles_author_index
    on articles (author_id)
  `;
  const columns = await sql<{
    column_name: string;
    data_type: string;
    is_nullable: string;
  }[]>`
    select column_name, data_type, is_nullable
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'articles'
    order by ordinal_position
  `;
  const testSlug = `phase-23-db-test-${Date.now()}`;
  const [testArticle] = await sql<{
    id: string;
    title: string;
    slug: string;
    status: string;
  }[]>`
    insert into articles (
      title,
      slug,
      content,
      status,
      reading_time_minutes,
      is_featured,
      published_at,
      updated_at
    )
    values (
      'Phase 23 Database Test',
      ${testSlug},
      'Functional database insert verification.',
      'draft',
      1,
      false,
      null,
      now()
    )
    returning id, title, slug, status
  `;
  await sql`
    delete from articles
    where id = ${testArticle.id}
  `;
  console.log("");
  console.log("ARTICLE DATABASE REPAIR PASSED");
  console.log(`Columns verified: ${columns.length}`);
  console.log(`Insert verified: ${testArticle.id}`);
  console.log("Test record removed successfully.");
  } finally {
    await sql.end();
  }
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
