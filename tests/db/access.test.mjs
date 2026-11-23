// API grants, profile privacy, migration re-runs and the seed file.
import test, { before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createDb, U } from './setup.mjs';

const DENIED = '42501';

for (const supabaseDefaults of [false, true]) {
  describe(supabaseDefaults ? 'project with Supabase default grants' : 'project without any grants', () => {
    let ctx;
    let course;
    before(async () => {
      ctx = await createDb({ supabaseDefaults });
      await ctx.signup(U.admin, 'admin@x.vn', { first_name: 'Ad' });
      await ctx.signup(U.inst, 'gv1@x.vn', { first_name: 'GV', role: 'instructor' });
      await ctx.signup(U.inst2, 'gv2@x.vn', { role: 'instructor' });
      await ctx.signup(U.stu, 'hv1@x.vn', { first_name: 'HV' });
      await ctx.db.query(`update users set role = 'admin' where id = $1`, [U.admin]);
      await ctx.db.query(`update users set phone = '0900' where id = $1`, [U.stu]);
      course = (await ctx.one(
        `insert into courses (instructor_id, title, description, price, status) values ($1, 'C', 'd', 0, 'published') returning course_id`, [U.inst])).course_id;
      await ctx.db.query(`insert into enrollments (student_id, course_id) values ($1, $2)`, [U.stu, course]);
    });

    test('guests can read every public table', async () => {
      for (const t of ['app_settings', 'categories', 'courses', 'modules', 'lessons', 'course_outline', 'public_profiles', 'reviews',
        'forum_topics', 'forum_replies', 'certificates']) {
        const r = await ctx.as(null, `select * from ${t} limit 1`);
        assert.equal(r.error, undefined, t);
      }
    });

    test('guests get no rows from private tables', async () => {
      for (const t of ['users', 'enrollments', 'transactions', 'lesson_progress', 'coupons', 'support_tickets']) {
        const r = await ctx.as(null, `select * from ${t}`);
        assert.equal(r.error, undefined, t);
        assert.equal(r.rows.length, 0, t);
      }
    });

    test('guests can call the public RPCs', async () => {
      assert.equal((await ctx.as(null, `select quote_checkout(array[1], null)`)).error, undefined);
      assert.equal((await ctx.as(null, `select increment_topic_view(1)`)).error, undefined);
    });

    test('a user reads only their own users row', async () => {
      const r = await ctx.as(U.stu, `select id from users`);
      assert.deepEqual(r.rows, [{ id: U.stu }]);
    });

    test('admins read all users', async () => {
      assert.equal((await ctx.as(U.admin, `select id from users`)).rows.length, 4);
    });

    test('public_profiles shows names but no contact data', async () => {
      const r = await ctx.as(null, `select * from public_profiles where id = $1`, [U.stu]);
      assert.equal(r.rows[0].first_name, 'HV');
      for (const col of ['email', 'phone', 'status', 'last_login', 'social_link']) assert.ok(!(col in r.rows[0]), col);
    });

    test('public_profiles cannot be used to write users', async () => {
      for (const uid of [null, U.stu]) {
        for (const sql of [`update public_profiles set role = 'admin'`, `delete from public_profiles`,
          `insert into public_profiles (id, role) values ('${U.stu2}', 'admin')`]) {
          assert.equal((await ctx.as(uid, sql)).code, DENIED, sql);
        }
      }
    });

    test('public_profiles stays read-only even if write access is granted by mistake', async () => {
      await ctx.db.exec(`grant all on public_profiles to anon`);
      assert.equal((await ctx.as(null, `update public_profiles set role = 'admin'`)).code, DENIED);
      assert.equal((await ctx.one(`select count(*)::int n from users where role = 'admin'`)).n, 1);
      await ctx.db.exec(`revoke all on public_profiles from anon; grant select on public_profiles to anon`);
    });

    test('course_student_emails is limited to the course instructor and admins', async () => {
      const call = (uid) => ctx.as(uid, `select email from course_student_emails($1)`, [course]);
      assert.deepEqual((await call(U.inst)).rows, [{ email: 'hv1@x.vn' }]);
      assert.equal((await call(U.admin)).rows.length, 1);
      for (const uid of [null, U.stu, U.inst2]) assert.equal((await call(uid)).rows.length, 0);
    });

    test('recalc_course_stats is not callable from the API', async () => {
      for (const uid of [null, U.stu]) assert.equal((await ctx.as(uid, `select recalc_course_stats($1)`, [course])).code, DENIED);
    });

    test('re-running all migrations keeps privacy and does not approve pending instructors', async () => {
      await ctx.migrate();
      assert.equal((await ctx.one(`select admin_approved from users where id = $1`, [U.inst2])).admin_approved, false);
      assert.equal((await ctx.as(null, `select * from users`)).rows.length, 0);
    });
  });
}

test('seed file runs on a fresh database', async () => {
  const { one } = await createDb({ seed: true });
  const r = await one(`select (select count(*)::int from courses where status = 'published') courses,
    (select count(*)::int from users where role = 'instructor' and admin_approved) instructors, (select count(*)::int from coupons) coupons`);
  assert.deepEqual(r, { courses: 4, instructors: 2, coupons: 2 });
});
