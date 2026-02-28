-- ══════════════════════════════════════════════════════════════════════════════
-- DIALFLOW — Professional Demo Seed Data
--
-- Run AFTER the main migration (20260228100000_cookie_auth_tables.sql).
-- Run in Supabase Dashboard → SQL Editor.
--
-- This script uses YOUR existing admin account (looked up dynamically).
-- It creates: 6 team members, 5 app_users (members), 40+ leads,
--             120+ call logs, 15+ notifications, user_settings,
--             and 20+ activity log entries — all realistic Indian data.
-- ══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  -- The admin user (your account)
  v_admin_id      UUID;
  v_tenant_id     UUID;

  -- Member user IDs (we create dummy member accounts)
  v_member1_id    UUID := gen_random_uuid();
  v_member2_id    UUID := gen_random_uuid();
  v_member3_id    UUID := gen_random_uuid();
  v_member4_id    UUID := gen_random_uuid();
  v_member5_id    UUID := gen_random_uuid();

  -- Team member IDs
  v_tm1_id        UUID := gen_random_uuid();
  v_tm2_id        UUID := gen_random_uuid();
  v_tm3_id        UUID := gen_random_uuid();
  v_tm4_id        UUID := gen_random_uuid();
  v_tm5_id        UUID := gen_random_uuid();
  v_tm6_id        UUID := gen_random_uuid();

  -- Lead IDs (we'll need these for call_logs)
  v_lead_ids      UUID[] := ARRAY[]::UUID[];
  v_lead_id       UUID;
  v_i             INT;

  -- Helpers
  v_hash          TEXT := 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'; -- SHA-256 hash of "password123"

BEGIN
  -- ═══════════════════════════════════════════════════════════════════════════
  -- 1. Get the admin user's ID & tenant
  -- ═══════════════════════════════════════════════════════════════════════════
  SELECT id, tenant_id INTO v_admin_id, v_tenant_id
    FROM public.app_users
   WHERE role = 'admin'
   ORDER BY created_at ASC
   LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No admin user found. Please sign up and set role to admin first.';
  END IF;

  RAISE NOTICE 'Using admin % in tenant %', v_admin_id, v_tenant_id;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 2. Create 5 member accounts (app_users)
  -- ═══════════════════════════════════════════════════════════════════════════
  INSERT INTO public.app_users (id, tenant_id, email, mobile, password_hash, display_name, role) VALUES
    (v_member1_id, v_tenant_id, 'rahul.sharma@dialflow.demo',   '9876543210', v_hash, 'Rahul Sharma',    'member'),
    (v_member2_id, v_tenant_id, 'priya.patel@dialflow.demo',    '9876543211', v_hash, 'Priya Patel',     'member'),
    (v_member3_id, v_tenant_id, 'amit.verma@dialflow.demo',     '9876543212', v_hash, 'Amit Verma',      'member'),
    (v_member4_id, v_tenant_id, 'sneha.gupta@dialflow.demo',    '9876543213', v_hash, 'Sneha Gupta',     'member'),
    (v_member5_id, v_tenant_id, 'vikram.singh@dialflow.demo',   '9876543214', v_hash, 'Vikram Singh',    'member');

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 3. Create 6 team members (linked to member accounts)
  -- ═══════════════════════════════════════════════════════════════════════════
  INSERT INTO public.team_members (id, tenant_id, linked_user_id, name, email, phone, status, avatar_initials, avatar_color) VALUES
    (v_tm1_id, v_tenant_id, v_member1_id, 'Rahul Sharma',    'rahul.sharma@dialflow.demo',   '+91 98765 43210', 'active',  'RS', 'violet'),
    (v_tm2_id, v_tenant_id, v_member2_id, 'Priya Patel',     'priya.patel@dialflow.demo',    '+91 98765 43211', 'active',  'PP', 'blue'),
    (v_tm3_id, v_tenant_id, v_member3_id, 'Amit Verma',      'amit.verma@dialflow.demo',     '+91 98765 43212', 'active',  'AV', 'emerald'),
    (v_tm4_id, v_tenant_id, v_member4_id, 'Sneha Gupta',     'sneha.gupta@dialflow.demo',    '+91 98765 43213', 'idle',    'SG', 'orange'),
    (v_tm5_id, v_tenant_id, v_member5_id, 'Vikram Singh',    'vikram.singh@dialflow.demo',   '+91 98765 43214', 'active',  'VS', 'pink'),
    (v_tm6_id, v_tenant_id, NULL,         'Neha Reddy',      'neha.reddy@dialflow.demo',     '+91 98765 43215', 'offline', 'NR', 'cyan');

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 4. Create 45 leads (mix of statuses, some assigned, some unassigned)
  -- ═══════════════════════════════════════════════════════════════════════════

  -- NEW leads (10) — unassigned
  FOR v_i IN 1..10 LOOP
    v_lead_id := gen_random_uuid();
    v_lead_ids := v_lead_ids || v_lead_id;
    INSERT INTO public.leads (id, tenant_id, name, phone, status, assigned_to, created_at) VALUES
      (v_lead_id, v_tenant_id,
       (ARRAY['Arjun Mehta','Kavita Iyer','Rajesh Kumar','Deepak Joshi','Sunita Rao',
              'Manish Tiwari','Pooja Nair','Ravi Shankar','Ananya Das','Kiran Bhat'])[v_i],
       '+91 ' || (9000000000 + v_i * 111)::text,
       'new',
       NULL,
       now() - (random() * interval '7 days'));
  END LOOP;

  -- CONTACTED leads (12) — assigned to various team members
  FOR v_i IN 1..12 LOOP
    v_lead_id := gen_random_uuid();
    v_lead_ids := v_lead_ids || v_lead_id;
    INSERT INTO public.leads (id, tenant_id, name, phone, status, assigned_to, created_at) VALUES
      (v_lead_id, v_tenant_id,
       (ARRAY['Sanjay Kapoor','Meera Jain','Vikash Agarwal','Rohit Malhotra','Anjali Deshmukh',
              'Nitin Saxena','Swati Pandey','Arun Pillai','Divya Menon','Gaurav Choudhary',
              'Rekha Bhatt','Suresh Naidu'])[v_i],
       '+91 ' || (8000000000 + v_i * 222)::text,
       'contacted',
       (ARRAY[v_tm1_id, v_tm2_id, v_tm3_id, v_tm4_id, v_tm5_id, v_tm1_id,
              v_tm2_id, v_tm3_id, v_tm4_id, v_tm5_id, v_tm1_id, v_tm2_id])[v_i],
       now() - (random() * interval '14 days'));
  END LOOP;

  -- INTERESTED leads (13) — assigned to various team members
  FOR v_i IN 1..13 LOOP
    v_lead_id := gen_random_uuid();
    v_lead_ids := v_lead_ids || v_lead_id;
    INSERT INTO public.leads (id, tenant_id, name, phone, status, assigned_to, created_at) VALUES
      (v_lead_id, v_tenant_id,
       (ARRAY['Vivek Reddy','Nisha Khanna','Aarav Sinha','Tanya Bose','Hemant Kulkarni',
              'Shruti Mishra','Manoj Iyer','Pallavi Rao','Siddharth Jha','Komal Thakur',
              'Ashish Dubey','Ritu Sharma','Naveen Rajan'])[v_i],
       '+91 ' || (7000000000 + v_i * 333)::text,
       'interested',
       (ARRAY[v_tm1_id, v_tm2_id, v_tm3_id, v_tm1_id, v_tm4_id,
              v_tm5_id, v_tm2_id, v_tm3_id, v_tm5_id, v_tm4_id,
              v_tm1_id, v_tm2_id, v_tm3_id])[v_i],
       now() - (random() * interval '21 days'));
  END LOOP;

  -- CLOSED leads (10) — assigned to various team members
  FOR v_i IN 1..10 LOOP
    v_lead_id := gen_random_uuid();
    v_lead_ids := v_lead_ids || v_lead_id;
    INSERT INTO public.leads (id, tenant_id, name, phone, status, assigned_to, created_at) VALUES
      (v_lead_id, v_tenant_id,
       (ARRAY['Prakash Hegde','Lakshmi Nair','Dinesh Goyal','Ritika Sen','Sunil Chatterjee',
              'Aparna Mukherjee','Harish Vyas','Geeta Raghavan','Pankaj Tandon','Usha Mahajan'])[v_i],
       '+91 ' || (6000000000 + v_i * 444)::text,
       'closed',
       (ARRAY[v_tm1_id, v_tm2_id, v_tm3_id, v_tm4_id, v_tm5_id,
              v_tm1_id, v_tm2_id, v_tm3_id, v_tm4_id, v_tm5_id])[v_i],
       now() - (random() * interval '30 days'));
  END LOOP;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 5. Create 130+ call logs across the last 14 days
  --    Mix of outcomes, durations, and team members
  -- ═══════════════════════════════════════════════════════════════════════════

  -- Calls for assigned leads (contacted, interested, closed)
  FOR v_i IN 11..45 LOOP  -- indices 11-45 are the assigned leads
    -- Each assigned lead gets 2-4 calls
    FOR v_lead_id IN 1..((v_i % 3) + 2) LOOP
      INSERT INTO public.call_logs (lead_id, bda_id, duration_seconds, outcome, notes, created_at)
      SELECT
        v_lead_ids[v_i],
        (ARRAY[v_member1_id, v_member2_id, v_member3_id, v_member4_id, v_member5_id])[1 + (v_i % 5)],
        (30 + floor(random() * 570))::int,  -- 30s to 600s (10 min)
        (ARRAY['Interested', 'Not Interested', 'Follow Up', 'Voicemail', 'Wrong Number', 'Closed Won'])[1 + floor(random() * 6)],
        (ARRAY[
          'Discussed product features, client seems keen.',
          'Client requested a callback next week.',
          'Not the right fit for their current needs.',
          'Left voicemail, will try again tomorrow.',
          'Wrong number, need to verify contact details.',
          'Deal closed! Client signed the annual plan.',
          'Follow-up required — needs pricing details.',
          'Client is comparing with competitors, needs time.',
          'Very positive response, scheduling a demo.',
          'Client on vacation, will reconnect next month.',
          'Introduced premium features. Client wants proposal.',
          'Discussed payment terms. Moving to contract stage.'
        ])[1 + floor(random() * 12)],
        now() - (random() * interval '14 days')
      ;
    END LOOP;
  END LOOP;

  -- Extra calls for today (so dashboard "today" stats show up)
  INSERT INTO public.call_logs (lead_id, bda_id, duration_seconds, outcome, notes, created_at) VALUES
    (v_lead_ids[11], v_member1_id, 245, 'Interested',      'Great conversation. Client wants a demo next Tuesday.',   now() - interval '2 hours'),
    (v_lead_ids[15], v_member1_id, 180, 'Follow Up',       'Sent pricing doc, will follow up in 2 days.',            now() - interval '3 hours'),
    (v_lead_ids[23], v_member2_id, 320, 'Closed Won',      'Annual deal signed! ₹2.4L contract.',                    now() - interval '1 hour'),
    (v_lead_ids[25], v_member2_id, 95,  'Voicemail',       'No answer, left voicemail.',                             now() - interval '4 hours'),
    (v_lead_ids[30], v_member3_id, 410, 'Interested',      'Decision maker is interested. Meeting scheduled.',        now() - interval '30 minutes'),
    (v_lead_ids[35], v_member3_id, 60,  'Not Interested',  'Budget constraints, maybe next quarter.',                 now() - interval '5 hours'),
    (v_lead_ids[12], v_member4_id, 275, 'Closed Won',      'Closed on premium plan! Great win.',                      now() - interval '45 minutes'),
    (v_lead_ids[18], v_member4_id, 150, 'Follow Up',       'Needs internal approval. Following up Friday.',           now() - interval '6 hours'),
    (v_lead_ids[40], v_member5_id, 390, 'Interested',      'Very promising lead. Sending proposal today.',            now() - interval '90 minutes'),
    (v_lead_ids[42], v_member5_id, 120, 'Wrong Number',    'Incorrect number on file. Need to update.',              now() - interval '7 hours'),
    (v_lead_ids[20], v_member1_id, 500, 'Closed Won',      'Big deal! ₹5L annual contract confirmed.',               now() - interval '15 minutes'),
    (v_lead_ids[28], v_member2_id, 220, 'Follow Up',       'Demo went well, sending contract tomorrow.',             now() - interval '2 hours 30 minutes'),
    (v_lead_ids[33], v_member3_id, 180, 'Interested',      'Wants to discuss with co-founder.',                      now() - interval '3 hours 15 minutes'),
    (v_lead_ids[16], v_member4_id, 340, 'Closed Won',      'Enterprise deal closed. Onboarding starts Monday.',      now() - interval '1 hour 45 minutes'),
    (v_lead_ids[38], v_member5_id, 90,  'Not Interested',  'Wrong timing, suggest reaching out in Q3.',              now() - interval '5 hours 30 minutes');

  -- Yesterday's calls (for charts that show trends)
  INSERT INTO public.call_logs (lead_id, bda_id, duration_seconds, outcome, notes, created_at) VALUES
    (v_lead_ids[13], v_member1_id, 300, 'Interested',      'Product walkthrough completed.',                         now() - interval '1 day 2 hours'),
    (v_lead_ids[14], v_member1_id, 150, 'Follow Up',       'Needs approval from management.',                        now() - interval '1 day 4 hours'),
    (v_lead_ids[24], v_member2_id, 420, 'Closed Won',      'Premium plan signed. ₹1.8L deal.',                       now() - interval '1 day 1 hour'),
    (v_lead_ids[26], v_member2_id, 75,  'Voicemail',       'Tried twice, no answer.',                                now() - interval '1 day 6 hours'),
    (v_lead_ids[31], v_member3_id, 260, 'Interested',      'Competitive analysis shared. Client impressed.',          now() - interval '1 day 3 hours'),
    (v_lead_ids[36], v_member4_id, 190, 'Not Interested',  'Currently using a competitor. Locked in for 1 year.',     now() - interval '1 day 5 hours'),
    (v_lead_ids[41], v_member5_id, 350, 'Closed Won',      'Upgrade from basic to premium. Great upsell!',           now() - interval '1 day 30 minutes'),
    (v_lead_ids[43], v_member5_id, 100, 'Follow Up',       'Sent case studies. Following up next week.',             now() - interval '1 day 7 hours');

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 6. Notifications for the admin user (varied types & priorities)
  -- ═══════════════════════════════════════════════════════════════════════════
  INSERT INTO public.notifications (tenant_id, user_id, type, title, message, priority, is_read, action_url, created_at) VALUES
    -- Unread (recent)
    (v_tenant_id, v_admin_id, 'achievement',         '🏆 Milestone Reached!',              'Your team closed 10 deals this week. Outstanding performance!',                    'high',   false, '/analytics',           now() - interval '10 minutes'),
    (v_tenant_id, v_admin_id, 'lead_assigned',        'New Lead Assigned',                   'Lead "Arjun Mehta" has been assigned to Rahul Sharma.',                             'normal', false, '/leads',               now() - interval '25 minutes'),
    (v_tenant_id, v_admin_id, 'lead_status_change',   'Lead Status Updated',                 'Lead "Vivek Reddy" moved from Contacted → Interested by Rahul Sharma.',             'normal', false, '/leads',               now() - interval '1 hour'),
    (v_tenant_id, v_admin_id, 'call_reminder',        'Scheduled Call Reminder',             'Priya Patel has a follow-up call with "Nisha Khanna" at 3:00 PM today.',            'high',   false, '/leads',               now() - interval '2 hours'),
    (v_tenant_id, v_admin_id, 'system',               'Weekly Report Ready',                 'Your team performance report for this week is now available in Analytics.',           'normal', false, '/analytics',           now() - interval '3 hours'),
    (v_tenant_id, v_admin_id, 'team_update',          'New Team Member Added',               'Neha Reddy has been added to the team. Assign leads to get started.',                'normal', false, '/team',                now() - interval '4 hours'),
    (v_tenant_id, v_admin_id, 'lead_status_change',   'Deal Closed! 🎉',                    'Lead "Prakash Hegde" has been marked as Closed Won by Amit Verma. ₹3.2L deal.',      'urgent', false, '/leads',               now() - interval '5 hours'),

    -- Read (older)
    (v_tenant_id, v_admin_id, 'lead_assigned',        'Bulk Leads Assigned',                 '8 new leads were auto-assigned to active team members.',                             'normal', true,  '/leads',               now() - interval '1 day'),
    (v_tenant_id, v_admin_id, 'achievement',          '🔥 Streak! 5 Consecutive Wins',      'Rahul Sharma has closed 5 deals in a row. Consider a bonus!',                        'high',   true,  '/team',                now() - interval '1 day 3 hours'),
    (v_tenant_id, v_admin_id, 'system',               'System Maintenance Complete',          'Scheduled maintenance has been completed. All systems operational.',                  'low',    true,  NULL,                   now() - interval '2 days'),
    (v_tenant_id, v_admin_id, 'call_reminder',        'Missed Follow-up Alert',              'Sneha Gupta missed a scheduled call with "Hemant Kulkarni". Reschedule needed.',     'urgent', true,  '/leads',               now() - interval '2 days 5 hours'),
    (v_tenant_id, v_admin_id, 'lead_status_change',   'Lead Went Cold',                      'Lead "Dinesh Goyal" has not been contacted in 7 days. Consider reassigning.',         'normal', true,  '/leads',               now() - interval '3 days'),
    (v_tenant_id, v_admin_id, 'team_update',          'Team Member Status Change',           'Sneha Gupta status changed to idle. No calls in the last 2 hours.',                   'low',    true,  '/team',                now() - interval '3 days 2 hours'),
    (v_tenant_id, v_admin_id, 'achievement',          '📈 Monthly Target Hit!',              'Team hit 85% of the monthly conversion target with 5 days remaining.',                'high',   true,  '/analytics',           now() - interval '4 days'),
    (v_tenant_id, v_admin_id, 'system',               'New Feature: CSV Import',             'You can now bulk import leads via CSV. Try it from the Leads page.',                  'normal', true,  '/leads',               now() - interval '5 days');

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 7. User settings for the admin
  -- ═══════════════════════════════════════════════════════════════════════════
  INSERT INTO public.user_settings (user_id, notif_new_lead, notif_missed_call, notif_conversion, notif_team_updates, notif_daily_summary, auto_dial_next, cooldown_timer, show_post_call_modal, call_recording, default_lead_status, auto_assign_leads, timezone, language)
  VALUES (v_admin_id, true, true, true, true, true, false, 30, true, true, 'new', true, 'Asia/Kolkata', 'English')
  ON CONFLICT (user_id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 8. Activity logs (recent team activity)
  -- ═══════════════════════════════════════════════════════════════════════════
  INSERT INTO public.activity_logs (tenant_id, user_id, action, description, metadata, created_at) VALUES
    -- Today's activities
    (v_tenant_id, v_member1_id, 'success',   'Rahul Sharma closed a deal with Prakash Hegde — ₹3.2L annual contract',        '{"lead_name": "Prakash Hegde", "amount": 320000}',  now() - interval '15 minutes'),
    (v_tenant_id, v_member2_id, 'success',   'Priya Patel converted lead Nisha Khanna to Interested status',                  '{"lead_name": "Nisha Khanna"}',                     now() - interval '1 hour'),
    (v_tenant_id, v_member3_id, 'info',      'Amit Verma completed 8 calls today — 2 conversions',                            '{"calls": 8, "conversions": 2}',                    now() - interval '2 hours'),
    (v_tenant_id, v_admin_id,   'neutral',   '5 new leads imported via CSV by admin',                                         '{"count": 5}',                                      now() - interval '3 hours'),
    (v_tenant_id, v_member4_id, 'info',      'Sneha Gupta scheduled a follow-up with Hemant Kulkarni for tomorrow',           '{"lead_name": "Hemant Kulkarni"}',                  now() - interval '4 hours'),
    (v_tenant_id, v_member5_id, 'success',   'Vikram Singh closed premium deal with Lakshmi Nair — ₹1.8L',                   '{"lead_name": "Lakshmi Nair", "amount": 180000}',   now() - interval '5 hours'),
    (v_tenant_id, v_member1_id, 'milestone', 'Rahul Sharma hit 50 total conversions — Top Performer! 🏆',                     '{"milestone": "50_conversions"}',                   now() - interval '6 hours'),

    -- Yesterday
    (v_tenant_id, v_member2_id, 'success',   'Priya Patel closed deal with Sunil Chatterjee — ₹2.4L',                        '{"lead_name": "Sunil Chatterjee", "amount": 240000}', now() - interval '1 day 1 hour'),
    (v_tenant_id, v_member3_id, 'info',      'Amit Verma made 12 calls — highest in the team yesterday',                      '{"calls": 12}',                                       now() - interval '1 day 3 hours'),
    (v_tenant_id, v_admin_id,   'neutral',   'Admin reassigned 3 leads from Neha Reddy to active members',                    '{"count": 3}',                                        now() - interval '1 day 5 hours'),
    (v_tenant_id, v_member5_id, 'success',   'Vikram Singh converted 2 leads to Interested in a single session',              '{"count": 2}',                                        now() - interval '1 day 6 hours'),
    (v_tenant_id, v_member4_id, 'info',      'Sneha Gupta averaged 4.5 min talk time — best quality calls',                   '{"avg_duration_min": 4.5}',                            now() - interval '1 day 7 hours'),

    -- This week
    (v_tenant_id, v_member1_id, 'success',   'Rahul Sharma achieved 5 consecutive deal closures — Streak! 🔥',               '{"streak": 5}',                                       now() - interval '2 days'),
    (v_tenant_id, v_admin_id,   'milestone', 'Team crossed ₹15L in monthly revenue — 85% of target hit! 📈',                 '{"revenue": 1500000, "target_pct": 85}',               now() - interval '3 days'),
    (v_tenant_id, v_member2_id, 'info',      'Priya Patel completed training on the new objection handling module',           '{}',                                                   now() - interval '3 days 4 hours'),
    (v_tenant_id, v_admin_id,   'neutral',   'Neha Reddy added to the team — pending lead assignment',                        '{"member_name": "Neha Reddy"}',                        now() - interval '4 days'),
    (v_tenant_id, v_member3_id, 'success',   'Amit Verma upsold a client from Basic to Premium — ₹60K upgrade',              '{"amount": 60000}',                                    now() - interval '4 days 2 hours'),
    (v_tenant_id, v_member5_id, 'info',      'Vikram Singh completed 45 calls this week — Most Active Member',                '{"calls": 45}',                                        now() - interval '5 days'),
    (v_tenant_id, v_admin_id,   'milestone', 'DialFlow CRM launched for the team — Let''s go! 🚀',                           '{}',                                                   now() - interval '6 days'),
    (v_tenant_id, v_member4_id, 'success',   'Sneha Gupta closed her first deal with the new pitch deck — ₹1.2L',            '{"lead_name": "Ritika Sen", "amount": 120000}',        now() - interval '5 days 3 hours');

  RAISE NOTICE '✅ Demo data seeded successfully!';
  RAISE NOTICE '   • 5 member accounts created';
  RAISE NOTICE '   • 6 team members created';
  RAISE NOTICE '   • 45 leads (10 new, 12 contacted, 13 interested, 10 closed)';
  RAISE NOTICE '   • 120+ call logs across 14 days';
  RAISE NOTICE '   • 15 notifications (7 unread, 8 read)';
  RAISE NOTICE '   • 20 activity log entries';
  RAISE NOTICE '   • User settings for admin';

END $$;
