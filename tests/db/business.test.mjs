// Business rules and RLS, exercised end to end through the API roles.
// Steps build on each other, so they run in order and each check is reported as its own test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createDb, U } from './setup.mjs';

const { db, as, one, signup } = await createDb();
const ok = (cond, msg) => test(msg, () => assert.ok(cond));

await signup(U.admin, 'admin@x.vn', { first_name: 'Ad' });
await signup(U.inst, 'gv1@x.vn', { first_name: 'GV1', role: 'instructor' });
await signup(U.inst2, 'gv2@x.vn', { first_name: 'GV2', role: 'instructor' });
await signup(U.stu, 'hv1@x.vn', { first_name: 'HV1', role: 'admin' }); // tries to self-assign admin
await signup(U.stu2, 'hv2@x.vn', { first_name: 'HV2' });
await db.query(`update public.users set role = 'admin' where id = $1`, [U.admin]);

// --- users -------------------------------------------------------------
ok((await one(`select role from users where id = $1`, [U.stu])).role === 'student', 'signup cannot self-assign admin role');
ok((await one(`select admin_approved from users where id = $1`, [U.inst])).admin_approved === false, 'new instructor starts unapproved');
await as(U.stu, `update users set role = 'admin', status = 'active', first_name = 'Hacker' where id = $1`, [U.stu]);
const s1 = await one(`select role, first_name from users where id = $1`, [U.stu]);
ok(s1.role === 'student' && s1.first_name === 'Hacker', 'student edits own profile but cannot change role');
let r = await as(U.inst, `insert into courses (instructor_id, title, description, price) values ($1, 'x', 'y', 0) returning course_id`, [U.inst]);
ok(!!r.error, 'unapproved instructor cannot create course');
r = await as(U.admin, `update users set admin_approved = true where id = any($1::uuid[])`, [[U.inst, U.inst2]]);
ok(!r.error && (await one(`select admin_approved_at from users where id = $1`, [U.inst])).admin_approved_at, 'admin approves instructors (approved_at stamped)');

// --- courses -----------------------------------------------------------
r = await as(U.inst, `insert into courses (instructor_id, title, description, price, status, rating, total_enrollments)
                      values ($1, 'Paid', 'd', 500000, 'published', 5, 999) returning course_id, status, rating, total_enrollments`, [U.inst]);
ok(!r.error && r.rows[0].status === 'draft' && Number(r.rows[0].rating) === 0 && r.rows[0].total_enrollments === 0, 'instructor insert forced to draft with zeroed counters');
const paid = r.rows[0].course_id;
r = await as(U.inst, `insert into courses (instructor_id, title, description, price) values ($1, 'Free', 'd', 0) returning course_id`, [U.inst]);
const free = r.rows[0].course_id;

r = await as(U.inst2, `insert into modules (course_id, title) values ($1, 'evil')`, [paid]);
ok(!!r.error, "other instructor cannot add modules to someone else's course (old policy bug fixed)");
for (const c of [paid, free]) {
  const m = (await as(U.inst, `insert into modules (course_id, title, order_index) values ($1, 'M1', 0) returning module_id`, [c])).rows[0].module_id;
  await as(U.inst, `insert into lessons (module_id, title, content_type, youtube_url, video_duration, order_index, is_preview)
                    values ($1, 'L1', 'video', 'https://youtu.be/abcdefghijk', 600, 0, true), ($1, 'L2', 'text', null, 0, 1, false)`, [m]);
}
ok((await one(`select total_lessons, duration_hours from courses where course_id = $1`, [paid])).total_lessons === 2, 'lesson trigger updates total_lessons');
r = await as(U.inst2, `insert into lessons (module_id, title, content_type) select module_id, 'evil', 'text' from modules where course_id = $1`, [paid]);
ok(!!r.error || (await one(`select count(*)::int n from lessons where title = 'evil'`)).n === 0, 'other instructor cannot add lessons');

r = await as(U.stu, `select * from courses where course_id = $1`, [paid]);
ok(r.rows.length === 0, 'draft course hidden from students');
r = await as(U.inst, `update courses set status = 'published' where course_id = $1`, [paid]);
ok(!!r.error, 'instructor cannot self-publish');
r = await as(U.inst, `update courses set status = 'pending' where course_id = any($1::int[])`, [[paid, free]]);
ok(!r.error, 'instructor submits for review');
r = await as(U.admin, `update courses set status = 'published' where course_id = any($1::int[]) returning published_at`, [[paid, free]]);
ok(!r.error && r.rows.every((x) => x.published_at), 'admin publishes (published_at stamped)');

r = await as(null, `select title, is_preview from course_outline where course_id = $1 order by order_index`, [paid]);
ok(r.rows.length === 2, 'anon sees public outline of published course');
r = await as(U.stu, `select l.title, l.youtube_url from lessons l join modules m using (module_id) where m.course_id = $1`, [paid]);
if (r.error) console.log('ERR', r.error);
ok(r.rows?.length === 1 && r.rows[0].title === 'L1', 'non-enrolled student sees only preview lesson rows');

// --- enrollment & checkout ----------------------------------------------
r = await as(U.stu, `insert into enrollments (student_id, course_id) values ($1, $2)`, [U.stu, paid]);
ok(!!r.error, 'student cannot self-enroll in paid course');
r = await as(U.stu, `insert into enrollments (student_id, course_id) values ($1, $2) returning enrollment_id`, [U.stu, free]);
ok(!r.error, 'student self-enrolls in free course');
const freeEnr = r.rows[0].enrollment_id;

r = await as(U.admin, `insert into coupons (code, discount_type, discount_value, max_uses) values ('SALE20', 'percent', 20, 1)`);
ok(!r.error, 'admin creates coupon');
r = await as(U.stu, `select * from coupons`);
ok(r.rows.length === 0, 'students cannot list coupons');
r = await as(U.stu, `select quote_checkout(array[$1, $2]::int[], 'sale20') q`, [paid, free]);
const q = r.rows?.[0]?.q;
ok(q && q.coupon_valid && Number(q.total) === 400000 && q.items.length === 1, `quote skips owned course and applies 20% (total ${q?.total})`);
r = await as(U.stu, `select quote_checkout(array[$1]::int[], 'NOPE') q`, [paid]);
ok(r.rows[0].q.coupon_valid === false, 'invalid coupon rejected in quote');
r = await as(U.stu, `select checkout(array[$1]::int[], 'SALE20', 'credit_card') c`, [paid]);
ok(!r.error && r.rows[0].c.reference.startsWith('SIM-'), 'checkout succeeds ' + (r.error ?? ''));
ok((await one(`select used_count from coupons where code = 'SALE20'`)).used_count === 1, 'coupon usage counted');
ok((await one(`select count(*)::int n from enrollments where student_id = $1 and course_id = $2`, [U.stu, paid])).n === 1, 'checkout created enrollment');
r = await as(U.stu2, `select checkout(array[$1]::int[], 'SALE20', 'paypal') c`, [paid]);
ok(!!r.error, 'coupon max_uses enforced');
r = await as(U.stu, `select checkout(array[$1]::int[], null, 'paypal') c`, [paid]);
ok(!!r.error, 'cannot buy an owned course twice');
ok((await one(`select total_enrollments from courses where course_id = $1`, [paid])).total_enrollments === 1, 'enrollment counter updated');
r = await as(U.stu, `select l.title from lessons l join modules m using (module_id) where m.course_id = $1`, [paid]);
ok(r.rows.length === 2, 'enrolled student sees all lessons');

// --- progress -> certificate --------------------------------------------
const paidEnr = (await one(`select enrollment_id from enrollments where student_id = $1 and course_id = $2`, [U.stu, paid])).enrollment_id;
const lessonIds = (await db.query(`select lesson_id from lessons l join modules m using (module_id) where m.course_id = $1 order by l.order_index`, [paid])).rows.map((x) => x.lesson_id);
await as(U.stu, `insert into lesson_progress (enrollment_id, lesson_id, is_completed) values ($1, $2, true)
                 on conflict (enrollment_id, lesson_id) do update set is_completed = excluded.is_completed`, [paidEnr, lessonIds[0]]);
ok(Number((await one(`select progress_percentage from enrollments where enrollment_id = $1`, [paidEnr])).progress_percentage) === 50, 'progress 50% after 1/2 lessons');
r = await as(U.stu2, `insert into lesson_progress (enrollment_id, lesson_id, is_completed) values ($1, $2, true)`, [paidEnr, lessonIds[1]]);
ok(!!r.error, "other student cannot write someone's progress");
await as(U.stu, `insert into lesson_progress (enrollment_id, lesson_id, is_completed) values ($1, $2, true)
                 on conflict (enrollment_id, lesson_id) do update set is_completed = excluded.is_completed`, [paidEnr, lessonIds[1]]);
const done = await one(`select status, completion_date from enrollments where enrollment_id = $1`, [paidEnr]);
ok(done.status === 'completed' && done.completion_date, 'enrollment completed at 100%');
r = await as(null, `select certificate_code from certificates where enrollment_id = $1`, [paidEnr]);
ok(r.rows.length === 1 && r.rows[0].certificate_code.length === 10, 'certificate issued and publicly verifiable');

// --- reviews & forum ----------------------------------------------------
r = await as(U.stu2, `insert into reviews (course_id, student_id, rating) values ($1, $2, 1)`, [paid, U.stu2]);
ok(!!r.error, 'non-enrolled user cannot review');
r = await as(U.stu, `insert into reviews (course_id, student_id, rating, comment) values ($1, $2, 4, 'good')`, [paid, U.stu]);
ok(!r.error && Number((await one(`select rating from courses where course_id = $1`, [paid])).rating) === 4, 'review updates course rating');

const topic = (await as(U.stu, `insert into forum_topics (course_id, author_id, title, content, type, is_pinned) values ($1, $2, 'Q?', 'help', 'question', true) returning topic_id, is_pinned`, [paid, U.stu])).rows[0];
ok(topic.is_pinned === false, 'student cannot pin own topic');
const reply = (await as(U.inst, `insert into forum_replies (topic_id, author_id, content, is_solution) values ($1, $2, 'answer', true) returning reply_id, is_solution`, [topic.topic_id, U.inst])).rows[0];
ok(reply.is_solution === false, 'reply cannot self-mark as solution');
ok((await one(`select reply_count from forum_topics where topic_id = $1`, [topic.topic_id])).reply_count === 1, 'reply_count trigger');
r = await as(U.stu2, `select mark_solution($1)`, [reply.reply_id]);
ok(!!r.error, 'unrelated user cannot mark solution');
r = await as(U.inst, `select mark_solution($1)`, [reply.reply_id]);
ok(!r.error && (await one(`select is_solution from forum_replies where reply_id = $1`, [reply.reply_id])).is_solution === true, 'course instructor marks solution');
r = await as(null, `select increment_topic_view($1)`, [topic.topic_id]);
ok(!r.error, 'view counter rpc');

// --- dashboards, refund, settings, tickets ------------------------------
r = await as(U.inst, `select instructor_stats() s`);
ok(!r.error && Number(r.rows[0].s.total_revenue) === 400000 && r.rows[0].s.revenue_by_month.length === 6, 'instructor_stats ' + (r.error ?? ''));
r = await as(U.stu, `select admin_stats() s`);
ok(!!r.error, 'admin_stats denied to students');
r = await as(U.admin, `select admin_stats() s`);
ok(!r.error && Number(r.rows[0].s.total_revenue) === 400000 && r.rows[0].s.revenue_by_instructor.length === 1, 'admin_stats ' + (r.error ?? ''));
const tx = (await one(`select transaction_id from transactions where course_id = $1`, [paid])).transaction_id;
r = await as(U.stu, `select refund_transaction($1)`, [tx]);
ok(!!r.error, 'students cannot refund');
r = await as(U.admin, `select refund_transaction($1)`, [tx]);
ok(!r.error && (await one(`select status from enrollments where enrollment_id = $1`, [paidEnr])).status === 'dropped', 'refund drops enrollment');
r = await as(U.stu, `select l.title from lessons l join modules m using (module_id) where m.course_id = $1`, [paid]);
ok(r.rows.length === 1, 'after refund only preview lesson visible');
r = await as(U.stu, `update app_settings set maintenance_mode = true`);
ok((await one(`select maintenance_mode from app_settings`)).maintenance_mode === false, 'students cannot change settings');
r = await as(null, `insert into support_tickets (email, subject, message) values ('g@x.vn', 's', 'm')`);
ok(!r.error, 'guest can submit support ticket');
r = await as(U.stu, `select * from support_tickets`);
ok(r.rows.length === 0, "users cannot read others' tickets");
r = await as(U.admin, `update users set status = 'suspended' where id = $1`, [U.stu2]);
r = await as(U.stu2, `select checkout(array[$1]::int[], null, 'paypal') c`, [free]);
ok(!!r.error, 'suspended user cannot checkout');
