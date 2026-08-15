-- ============================================================================
-- eengineer — seed community members + Community-tab conversation
--
-- Fills the "Community" tab (the Q&A / groupchat feed backed by `questions`)
-- of all four discipline groups — Aerospace, Mechanical, Software,
-- Environmental — with 6 seeded members and ~58 messages each (233 total),
-- plus 40 threaded replies and votes. The conversation is written to read like
-- a real group: it opens with hellos and "what is everyone working on", then
-- moves into the actual engineering of that discipline.
--
-- HOW TO RUN: paste into Supabase → SQL Editor → Run (it executes as
-- `postgres`, so RLS is not in the way). The whole thing is one transaction.
--
-- SAFE TO RE-RUN: every seeded account lives on the @seed.eengineer.local
-- email domain and is deleted at the top of this script. Deleting the
-- auth.users row cascades to profiles → questions → comments/votes/clubs, so
-- a re-run replaces the seed rather than duplicating it.
--
-- TO REMOVE THE SEED ENTIRELY (single statement, nothing else touched):
--   delete from auth.users where email like '%@seed.eengineer.local';
--
-- Deliberate choices:
--   * Accounts are created through auth.users so the normal signup triggers
--     (app.handle_new_user → app.ensure_member_profile) build the profile and
--     the builder role exactly as they would for a real member — no
--     hand-written profiles row that could drift from the real shape.
--   * Providers are mixed: github/linkedin accounts carry a matching
--     auth.identities row, so `verified` is true because app.profiles_guard
--     can see a real linked identity, not because we asserted it. Google
--     accounts stay unverified — the badge keeps meaning what it says.
--   * created_at values are spread across the last ~25 days in bursts, so the
--     feed shows "3d ago"/"2w ago" the way a live group would, not 233
--     messages posted in the same second. Everything is one transaction: if
--     any statement fails, nothing is left half-seeded.
-- ============================================================================

begin;

-- ── 0. Clean any previous run ───────────────────────────────────────────────
delete from auth.users where email like '%@seed.eengineer.local';

-- Reverse dependency order: seed_reply → seed_msg → seed_bot. These only
-- exist if a previous run left them behind on a pooled connection.
drop table if exists seed_reply;
drop table if exists seed_msg;
drop table if exists seed_bot;

-- ── 1. The roster ───────────────────────────────────────────────────────────
create temporary table seed_bot (
  handle       text primary key,
  id           uuid not null,
  display_name text not null,
  email        text not null,
  provider     text not null,               -- github | linkedin_oidc | google
  discipline   app.discipline not null,
  bio          text not null,
  interests    text[] not null,
  github_url   text,
  linkedin_url text,
  open_to_work boolean not null default false,
  joined_days  int not null                 -- account age, in days
);

insert into seed_bot
  (handle, id, display_name, email, provider, discipline, bio, interests, github_url, linkedin_url, open_to_work, joined_days)
values
-- Aerospace ------------------------------------------------------------------
($$jasur$$,   $$5eed0000-0000-4000-8000-0000000000a1$$, $$Jasur Rakhimov$$,     $$jasur.rakhimov@seed.eengineer.local$$,     $$github$$,        $$Aerospace$$,
 $$11th grade in Tashkent. Building model rockets with two friends after school — currently chasing our first 1 km flight.$$,
 array[$$Rocketry$$,$$Composites$$,$$Flight testing$$], $$https://github.com/jrakhimov$$, null, false, 61),
($$malika$$,  $$5eed0000-0000-4000-8000-0000000000a2$$, $$Malika Yusupova$$,    $$malika.yusupova@seed.eengineer.local$$,    $$google$$,        $$Aerospace$$,
 $$Aerodynamics side of the team: airfoils, drag estimates, and far too many OpenRocket simulations.$$,
 array[$$Aerodynamics$$,$$CFD$$,$$Simulation$$], null, null, false, 74),
($$timur$$,   $$5eed0000-0000-4000-8000-0000000000a3$$, $$Timur Abdullaev$$,    $$timur.abdullaev@seed.eengineer.local$$,    $$github$$,        $$Aerospace$$,
 $$Avionics. Flight computers, altimeters, and telemetry that mostly survives the flight.$$,
 array[$$Avionics$$,$$Embedded$$,$$Telemetry$$], $$https://github.com/tabdullaev$$, null, true, 55),
($$nilufar$$, $$5eed0000-0000-4000-8000-0000000000a4$$, $$Nilufar Karimova$$,   $$nilufar.karimova@seed.eengineer.local$$,   $$linkedin_oidc$$, $$Aerospace$$,
 $$Payload and systems. Building a CanSat-style payload with pressure, temperature and (if it fits) a camera.$$,
 array[$$Payloads$$,$$CanSat$$,$$Systems engineering$$], null, $$https://linkedin.com/in/nkarimova$$, false, 48),
($$daniyar$$, $$5eed0000-0000-4000-8000-0000000000a5$$, $$Daniyar Seitkali$$,   $$daniyar.seitkali@seed.eengineer.local$$,   $$google$$,        $$Aerospace$$,
 $$From Almaty. Solid propellant experiments (KNSB), static fire testing, and a healthy respect for standoff distance.$$,
 array[$$Propulsion$$,$$Solid motors$$,$$Testing$$], null, null, false, 39),
($$bekzod$$,  $$5eed0000-0000-4000-8000-0000000000a6$$, $$Bekzod Tursunov$$,    $$bekzod.tursunov@seed.eengineer.local$$,    $$github$$,        $$Aerospace$$,
 $$Recovery systems. Parachutes, ejection charges, and finding the rocket afterwards.$$,
 array[$$Recovery$$,$$Parachutes$$,$$Rocketry$$], $$https://github.com/btursunov$$, null, false, 33),

-- Mechanical -----------------------------------------------------------------
($$sardor$$,  $$5eed0000-0000-4000-8000-0000000000b1$$, $$Sardor Aliyev$$,      $$sardor.aliyev@seed.eengineer.local$$,      $$github$$,        $$Mechanical$$,
 $$Robotics team captain. Chassis design in Fusion 360 and a workshop full of half-finished brackets.$$,
 array[$$CAD$$,$$Robotics$$,$$Fabrication$$], $$https://github.com/saliyev$$, null, false, 68),
($$kamila$$,  $$5eed0000-0000-4000-8000-0000000000b2$$, $$Kamila Nazarova$$,    $$kamila.nazarova@seed.eengineer.local$$,    $$google$$,        $$Mechanical$$,
 $$FEA and structures. I like finding out which bracket breaks before we build it.$$,
 array[$$FEA$$,$$Structures$$,$$Simulation$$], null, null, false, 59),
($$rustam$$,  $$5eed0000-0000-4000-8000-0000000000b3$$, $$Rustam Ibragimov$$,   $$rustam.ibragimov@seed.eengineer.local$$,   $$github$$,        $$Mechanical$$,
 $$Machining and tolerances. My uncle's shop has a lathe and I have opinions about fits.$$,
 array[$$Machining$$,$$GD&T$$,$$Manufacturing$$], $$https://github.com/ribragimov$$, null, true, 52),
($$zarina$$,  $$5eed0000-0000-4000-8000-0000000000b4$$, $$Zarina Toshpulatova$$, $$zarina.toshpulatova@seed.eengineer.local$$, $$linkedin_oidc$$, $$Mechanical$$,
 $$Drivetrains — gearboxes, belts, and the eternal argument about ratios.$$,
 array[$$Drivetrain$$,$$Gearboxes$$,$$Robotics$$], null, $$https://linkedin.com/in/ztoshpulatova$$, false, 44),
($$otabek$$,  $$5eed0000-0000-4000-8000-0000000000b5$$, $$Otabek Yuldashev$$,   $$otabek.yuldashev@seed.eengineer.local$$,   $$google$$,        $$Mechanical$$,
 $$3D printing and rapid prototyping. Two printers, one of which actually works.$$,
 array[$$3D printing$$,$$Prototyping$$,$$Materials$$], null, null, false, 36),
($$dilnoza$$, $$5eed0000-0000-4000-8000-0000000000b6$$, $$Dilnoza Ergasheva$$,  $$dilnoza.ergasheva@seed.eengineer.local$$,  $$github$$,        $$Mechanical$$,
 $$Mechanisms and thermal. Currently obsessed with linkages that do not bind.$$,
 array[$$Mechanisms$$,$$Thermal$$,$$CAD$$], $$https://github.com/dergasheva$$, null, false, 30),

-- Software -------------------------------------------------------------------
($$aziz$$,    $$5eed0000-0000-4000-8000-0000000000c1$$, $$Aziz Mirzayev$$,      $$aziz.mirzayev@seed.eengineer.local$$,      $$github$$,        $$Software$$,
 $$Firmware. STM32, ESP32, and a logic analyzer that has saved me more times than I can count.$$,
 array[$$Embedded$$,$$C/C++$$,$$Firmware$$], $$https://github.com/amirzayev$$, null, false, 71),
($$sevara$$,  $$5eed0000-0000-4000-8000-0000000000c2$$, $$Sevara Nurmatova$$,   $$sevara.nurmatova@seed.eengineer.local$$,   $$google$$,        $$Software$$,
 $$Front-end. I build the dashboards the hardware people stare at during tests.$$,
 array[$$React$$,$$TypeScript$$,$$Data viz$$], null, null, true, 57),
($$bobur$$,   $$5eed0000-0000-4000-8000-0000000000c3$$, $$Bobur Xolmatov$$,     $$bobur.xolmatov@seed.eengineer.local$$,     $$github$$,        $$Software$$,
 $$Robotics software — ROS 2, navigation, and debugging why the robot drove into a wall.$$,
 array[$$ROS$$,$$Python$$,$$Robotics$$], $$https://github.com/bxolmatov$$, null, false, 50),
($$madina$$,  $$5eed0000-0000-4000-8000-0000000000c4$$, $$Madina Ismoilova$$,   $$madina.ismoilova@seed.eengineer.local$$,   $$linkedin_oidc$$, $$Software$$,
 $$Telemetry and data. Pandas, matplotlib, and turning SD-card logs into something a team can read.$$,
 array[$$Data analysis$$,$$Python$$,$$Telemetry$$], null, $$https://linkedin.com/in/mismoilova$$, false, 42),
($$ulugbek$$, $$5eed0000-0000-4000-8000-0000000000c5$$, $$Ulugbek Rashidov$$,   $$ulugbek.rashidov@seed.eengineer.local$$,   $$google$$,        $$Software$$,
 $$First year, learning C properly. Ask me again in six months.$$,
 array[$$Learning$$,$$C$$,$$Arduino$$], null, null, false, 21),
($$feruza$$,  $$5eed0000-0000-4000-8000-0000000000c6$$, $$Feruza Qodirova$$,    $$feruza.qodirova@seed.eengineer.local$$,    $$github$$,        $$Software$$,
 $$Computer vision. Line following, object detection, and fighting my own dataset.$$,
 array[$$Computer vision$$,$$ML$$,$$OpenCV$$], $$https://github.com/fqodirova$$, null, false, 34),

-- Environmental --------------------------------------------------------------
($$gulnora$$,  $$5eed0000-0000-4000-8000-0000000000d1$$, $$Gulnora Sattorova$$, $$gulnora.sattorova@seed.eengineer.local$$,  $$github$$,        $$Environmental$$,
 $$Water treatment. Building and testing low-cost filters for village wells.$$,
 array[$$Water treatment$$,$$Filtration$$,$$Field testing$$], $$https://github.com/gsattorova$$, null, false, 64),
($$javohir$$,  $$5eed0000-0000-4000-8000-0000000000d2$$, $$Javohir Umarov$$,    $$javohir.umarov@seed.eengineer.local$$,     $$google$$,        $$Environmental$$,
 $$Air quality. Running a small network of PM2.5 sensors around my district in Tashkent.$$,
 array[$$Air quality$$,$$Sensors$$,$$Open data$$], null, null, false, 53),
($$anvar$$,    $$5eed0000-0000-4000-8000-0000000000d3$$, $$Anvar Qosimov$$,     $$anvar.qosimov@seed.eengineer.local$$,      $$linkedin_oidc$$, $$Environmental$$,
 $$Irrigation and soil. From Nukus — the Aral is not an abstract topic where I live.$$,
 array[$$Irrigation$$,$$Soil science$$,$$Water$$], null, $$https://linkedin.com/in/aqosimov$$, false, 47),
($$shahzoda$$, $$5eed0000-0000-4000-8000-0000000000d4$$, $$Shahzoda Rustamova$$, $$shahzoda.rustamova@seed.eengineer.local$$, $$github$$,       $$Environmental$$,
 $$Solar and energy efficiency. Measuring how much dust actually costs a panel here.$$,
 array[$$Solar$$,$$Energy$$,$$Measurement$$], $$https://github.com/srustamova$$, null, true, 38),
($$mirjalol$$, $$5eed0000-0000-4000-8000-0000000000d5$$, $$Mirjalol Ismatov$$,  $$mirjalol.ismatov@seed.eengineer.local$$,   $$google$$,        $$Environmental$$,
 $$Waste and recycling. Currently building a very loud plastic shredder.$$,
 array[$$Recycling$$,$$Circular economy$$,$$Fabrication$$], null, null, false, 29),
($$nodira$$,   $$5eed0000-0000-4000-8000-0000000000d6$$, $$Nodira Alimova$$,    $$nodira.alimova@seed.eengineer.local$$,     $$github$$,        $$Environmental$$,
 $$Environmental data. Soil salinity mapping and making the numbers mean something.$$,
 array[$$Data analysis$$,$$GIS$$,$$Soil science$$], $$https://github.com/nalimova$$, null, false, 25);

-- ── 2. Accounts ─────────────────────────────────────────────────────────────
-- The insert below fires app.handle_new_user(), which creates the profiles row
-- and the 'builder' user_roles row through the normal signup path.
insert into auth.users (
  instance_id, id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, last_sign_in_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  $$00000000-0000-0000-0000-000000000000$$::uuid,
  b.id,
  $$authenticated$$,
  $$authenticated$$,
  b.email,
  now() - make_interval(days => b.joined_days),
  jsonb_build_object($$provider$$, b.provider, $$providers$$, jsonb_build_array(b.provider)),
  jsonb_build_object($$name$$, b.display_name, $$full_name$$, b.display_name, $$email$$, b.email),
  now() - make_interval(days => b.joined_days),
  now() - make_interval(days => b.joined_days),
  now() - make_interval(days => 1),
  $$$$, $$$$, $$$$, $$$$
from seed_bot b;

-- The linked identity is what makes `verified` legitimate for the github /
-- linkedin accounts — app.profiles_guard checks this table, so without these
-- rows the badge would be a lie the schema is designed to reject.
insert into auth.identities (
  id, user_id, provider, provider_id, identity_data, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  b.id,
  b.provider,
  b.id::text,
  jsonb_build_object(
    $$sub$$, b.id::text,
    $$email$$, b.email,
    $$name$$, b.display_name,
    $$full_name$$, b.display_name,
    $$email_verified$$, true
  ),
  now() - make_interval(days => 1),
  now() - make_interval(days => b.joined_days),
  now() - make_interval(days => b.joined_days)
from seed_bot b;

-- ── 3. Profile detail ───────────────────────────────────────────────────────
-- Everything the signup path cannot know: discipline, bio, interests, links.
-- verified / oauth_provider are deliberately NOT touched here — they were set
-- from the identity above and app.profiles_guard defends them.
update profiles p set
  display_name = b.display_name,
  discipline   = b.discipline,
  bio          = b.bio,
  interests    = b.interests,
  github_url   = coalesce(b.github_url, p.github_url),
  linkedin_url = coalesce(b.linkedin_url, p.linkedin_url),
  open_to_work = b.open_to_work,
  online       = false
from seed_bot b
where p.id = b.id;

insert into user_roles (user_id, role)
select b.id, $$builder$$ from seed_bot b
on conflict (user_id) do nothing;

-- ── 4. Club membership ──────────────────────────────────────────────────────
-- Everyone joins their own discipline's club (this is what the hub's member
-- count reads), and a handful join a second group the way real people do.
insert into club_memberships (profile_id, discipline, joined_at)
select b.id, b.discipline, now() - make_interval(days => b.joined_days)
from seed_bot b
on conflict do nothing;

insert into club_memberships (profile_id, discipline, joined_at)
select b.id, x.discipline::app.discipline, now() - make_interval(days => greatest(b.joined_days - 5, 1))
from seed_bot b
join (values
  ($$timur$$,   $$Software$$),      -- avionics person who lives in the firmware group
  ($$nilufar$$, $$Software$$),
  ($$aziz$$,    $$Aerospace$$),
  ($$madina$$,  $$Aerospace$$),
  ($$bobur$$,   $$Mechanical$$),
  ($$otabek$$,  $$Aerospace$$),
  ($$dilnoza$$, $$Environmental$$),
  ($$nodira$$,  $$Software$$),
  ($$shahzoda$$,$$Mechanical$$),
  ($$sardor$$,  $$Software$$)
) as x(handle, discipline) on x.handle = b.handle
on conflict do nothing;

-- ── 5. The conversation ─────────────────────────────────────────────────────
-- One row per message. `minutes_ago` sets created_at, and the feed is ordered
-- by it, so the rows below are written oldest-first: greetings, then the
-- engineering. The discipline is taken from the author, so a message can never
-- land in the wrong group.
create temporary table seed_msg (
  key         text primary key,
  handle      text not null references seed_bot(handle),
  minutes_ago int  not null,
  text        text not null,
  qid         uuid not null default gen_random_uuid()
);

-- ── Aerospace ───────────────────────────────────────────────────────────────
insert into seed_msg (key, handle, minutes_ago, text) values
($$a01$$, $$jasur$$,   34530, $$salom everyone 👋 just found this group. i'm Jasur, 11th grade in Tashkent, me and two friends build model rockets after school$$),
($$a02$$, $$malika$$,  34495, $$hey Jasur, welcome! i'm Malika, i do the aero side — airfoils, drag, way too many simulations. good to see new people here$$),
($$a03$$, $$timur$$,   34460, $$hi both. Timur. i do the electronics, flight computer and altimeter mostly. still pretty weak on the aero part honestly$$),
($$a04$$, $$jasur$$,   34440, $$how is everyone doing btw? exam season here was brutal, i didn't touch the workshop for two weeks$$),
($$a05$$, $$nilufar$$, 34405, $$same. physics olympiad prep every single evening. finally free$$),
($$a06$$, $$bekzod$$,  34350, $$hello all. Bekzod, i'm on recovery. last flight our parachute came out at ~200m and shredded, so that's my entire personality now$$),
($$a07$$, $$malika$$,  34330, $$haha the recovery person always has the best stories$$),
($$a08$$, $$daniyar$$, 34280, $$hey, Daniyar from Almaty. we make our own solid motors, KNSB, nothing fancy. is anyone else here doing propellant or is it all commercial motors?$$),
($$a09$$, $$jasur$$,   34240, $$so what is everyone actually working on right now? we're on airframe number three, trying to hit 1 km this autumn$$),
($$a10$$, $$timur$$,   34205, $$1 km is a good target. our best is 430 m so far$$),
($$a11$$, $$nilufar$$, 34180, $$we're building a CanSat style payload — pressure, temperature, and a camera if we can make it fit$$),
($$a14$$, $$daniyar$$, 31450, $$question for the group: how do you pick your motor? we've been copying whatever other teams use and i'm starting to think that's why our last flight was so far off the prediction$$),
($$a15$$, $$malika$$,  31410, $$OpenRocket. weigh the real rocket, don't trust the CAD mass, put that number in and it gives you an apogee for every motor in the database. it's free$$),
($$a16$$, $$jasur$$,   31385, $$+1. the mistake we made for a whole year was entering dry mass and forgetting the motor casing itself$$),
($$a17$$, $$daniyar$$, 31350, $$downloading it now. does it take homemade motors?$$),
($$a18$$, $$malika$$,  31320, $$you can add a custom motor file if you have real thrust data from a static fire. without test data it's a guess with extra steps though$$),
($$a19$$, $$bekzod$$,  30120, $$recovery question — single or dual deploy? we keep landing 600-700 m from the pad and walking through fields to find the thing$$),
($$a20$$, $$timur$$,   30080, $$dual, if your altimeter has two channels. drogue at apogee, main at ~150 m. almost all the drift happens under the full canopy, so keeping the main packed until you're low is exactly the fix for your problem$$),
($$a21$$, $$bekzod$$,  30040, $$ours has one channel. sounds like i'm saving up$$),
($$a23$$, $$jasur$$,   27350, $$anyone have a rule of thumb for fin material? we cut 3 mm plywood and one fin came back with a visible twist in it$$),
($$a24$$, $$malika$$,  27320, $$could be flutter, could be plain aero load if the fin is big. plywood is honestly fine at our speeds — the mounting matters more than the material. are you surface mounting or through the wall?$$),
($$a25$$, $$jasur$$,   27295, $$surface mounted with epoxy fillets$$),
($$a26$$, $$malika$$,  27260, $$cut tabs and epoxy them through to the motor tube. it's maybe an hour more work and it basically ends fin problems forever$$),
($$a27$$, $$nilufar$$, 27225, $$we switched to TTW last season and haven't lost a fin since, can confirm$$),
($$a28$$, $$timur$$,   24500, $$spent the whole weekend fighting my altimeter code. apogee kept triggering on the way up, right around max Q$$),
($$a31$$, $$malika$$,  24410, $$a small Kalman on altitude + vertical velocity is less scary than it sounds, and "vertical velocity crossed zero" is a much more stable apogee test than "altitude stopped increasing"$$),
($$a32$$, $$timur$$,   24380, $$ok. there are embedded people in the Software group too, i'll ask there as well. thanks$$),
($$a33$$, $$nilufar$$, 21700, $$how do you all choose the nose cone shape? we default to ogive because it looks right, but i couldn't defend that to a judge$$),
($$a34$$, $$malika$$,  21660, $$below about mach 0.8 the difference between ogive, elliptical and parabolic is a few percent of drag, that's it. transonic and up the ogive shapes win clearly. for a 1 km flight pick whatever you can build cleanly — surface finish costs you more than the profile does$$),
($$a35$$, $$nilufar$$, 21630, $$"surface finish costs you more than the profile" — writing that down$$),
($$a37$$, $$bekzod$$,  18900, $$does anyone have a parachute sizing formula that actually works? we sized ours by eye and came down at something like 9 m/s$$),
($$a38$$, $$malika$$,  18870, $$v = sqrt(2mg / (rho*Cd*A)). aim for 4-6 m/s on the main. Cd is roughly 0.75 for a plain hemisphere and ~1.5 for a proper chute with a spill hole. solve for A$$),
($$a39$$, $$bekzod$$,  18840, $$9 m/s explains the cracked payload bay quite well then$$),
($$a41$$, $$daniyar$$, 17400, $$static fire on saturday if the weather holds. behind the workshop, 20 m of rope on the igniter$$),
($$a42$$, $$jasur$$,   17370, $$please be careful with that. 30 m minimum for anything above a G, and nobody standing anywhere near the nozzle line$$),
($$a43$$, $$timur$$,   17340, $$and film it. half the useful data ends up in the video when your load cell drops out$$),
($$a44$$, $$daniyar$$, 14520, $$we got a load cell trace! 41 N peak, 1.9 s burn. is that shape normal or are we regressing badly?$$),
($$a45$$, $$malika$$,  14490, $$41 N peak over 1.9 s sounds like a healthy KNSB grain to me. total impulse is the area under the curve — roughly 50 Ns puts you in H class, worth checking the rules for wherever you fly$$),
($$a48$$, $$timur$$,   11700, $$has anyone used LoRa for telemetry? i want live altitude on the ground instead of reading the SD card afterwards$$),
($$a49$$, $$jasur$$,   11670, $$433 MHz module here, about 2 km line of sight with a plain wire antenna. more than enough for our flights$$),
($$a50$$, $$timur$$,   11640, $$what rate do you push?$$),
($$a51$$, $$jasur$$,   11610, $$one packet per second on the way up, that's it. don't try to stream raw IMU, you'll just drop packets and learn nothing$$),
($$a52$$, $$malika$$,  10200, $$is anyone going to the propulsion webinar? i registered but i have no idea what level it's aimed at$$),
($$a53$$, $$nilufar$$, 10170, $$registered too. i want to ask how they decide between solid and liquid for small missions$$),
($$a55$$, $$jasur$$,   7300,  $$fun one: our rocket weathercocked hard into the wind and we lost maybe 100 m of altitude. the rail was vertical$$),
($$a56$$, $$malika$$,  7265,  $$rail exit velocity too low. you want 20+ m/s leaving the rail. longer rail or a punchier motor — with a slow exit a vertical rail just lets the wind steer it$$),
($$a57$$, $$jasur$$,   7230,  $$ours is 1.2 m. so i'm building a 2 m rail this weekend$$),
($$a59$$, $$nilufar$$, 5900,  $$payload fits!! 340 g with the battery, and the camera stays in 🎉$$),
($$a60$$, $$bekzod$$,  5870,  $$nice. how are you mounting it, foam?$$),
($$a61$$, $$nilufar$$, 5840,  $$3D printed sled with foam at both ends. someone from the Software group helped me get the SD logging working, shout out to them$$),
($$a62$$, $$timur$$,   4400,  $$flight computer v2 booted first try. i don't trust it$$),
($$a64$$, $$jasur$$,   3000,  $$launch day is set for the 30th if the weather cooperates. anyone near Tashkent is welcome, we head out to the field around 6am$$),
($$a66$$, $$bekzod$$,  2940,  $$i'll bring the new chute. 4.8 m/s on paper this time$$),
($$a67$$, $$malika$$,  1500,  $$quick one — does the Conrad Challenge accept a team of two? our third person moved to another school$$),
($$a68$$, $$nilufar$$, 1470,  $$it's 2 to 5 people as far as i remember, so you're fine. the deadline is end of october$$),
($$a69$$, $$jasur$$,   410,   $$good morning everyone ☀️ epoxy is curing, fins are through the wall this time. thanks for pushing me on that$$),
($$a72$$, $$bekzod$$,  95,    $$packed the new chute last night. it is going to work and i refuse to consider any alternative$$),
($$a73$$, $$nilufar$$, 42,    $$good luck both of you. we're doing a drop test off the roof tomorrow, will report back$$);

-- ── Mechanical ──────────────────────────────────────────────────────────────
insert into seed_msg (key, handle, minutes_ago, text) values
($$m01$$, $$sardor$$,  37200, $$hey everyone. Sardor, robotics team captain. we build a ~20 kg robot every spring and argue about it the rest of the year$$),
($$m02$$, $$kamila$$,  37160, $$hi! Kamila. i do FEA and structures, which in practice means telling Sardor his bracket is too thin 😄$$),
($$m03$$, $$sardor$$,  37130, $$she's right about 80% of the time, that's the annoying part$$),
($$m04$$, $$rustam$$,  37080, $$hello. Rustam. my uncle has a small shop with a lathe and a mill, so i end up making the parts everyone else designs$$),
($$m05$$, $$zarina$$,  37040, $$hi all, Zarina. drivetrain — gearboxes, belts, ratios. how is everyone doing? we just finished exams so the shop is finally open again$$),
($$m06$$, $$otabek$$,  36990, $$hey! Otabek, 3D printing. two printers, one of which actually works$$),
($$m07$$, $$dilnoza$$, 36950, $$hi everyone, Dilnoza. mechanisms and a bit of thermal. current project: a four bar linkage that refuses to stop binding$$),
($$m08$$, $$sardor$$,  36900, $$what is everyone building right now? we're redoing the chassis to be lighter, last year's was 6 kg of pure steel guilt$$),
($$m09$$, $$kamila$$,  36870, $$we're redesigning the arm. the old one deflected about 15 mm at full extension and everyone politely pretended not to notice$$),
($$m10$$, $$otabek$$,  36840, $$i'm printing a phone holder for the pit. important work$$),
($$m11$$, $$rustam$$,  34000, $$genuine question — how do you dimension your drawings? people send me a screenshot from Fusion with no tolerances and then act surprised when the part doesn't fit$$),
($$m12$$, $$rustam$$,  33930, $$one number per feature, and a tolerance on anything that touches another part. that's the whole ask$$),
($$m13$$, $$kamila$$,  33900, $$we put ±0.1 as a default note in the title block and it ended most of the arguments$$),
($$m14$$, $$zarina$$,  31500, $$gearbox question. motor is 12 V, stall torque 1.5 Nm, and we need about 8 Nm at the wheel. is 6:1 enough or do i want margin?$$),
($$m15$$, $$sardor$$,  31460, $$never size against stall torque. in normal driving you're at maybe 20% of stall, and at actual stall the motor is pulling enough current to trip the breaker anyway$$),
($$m16$$, $$kamila$$,  31430, $$size for the torque you need at your target speed, then check current draw at that operating point. stall is a limit, not a design point$$),
($$m17$$, $$zarina$$,  31400, $$so 8:1 and stop worrying. understood$$),
($$m18$$, $$otabek$$,  30000, $$PLA or PETG for structural brackets? everyone says PETG is stronger but my PETG parts snap right at the layer lines$$),
($$m19$$, $$kamila$$,  29970, $$PETG is tougher, PLA is stiffer. but layer adhesion beats material choice — if parts split along layers you're printing too cold or too fast, not using the wrong plastic$$),
($$m20$$, $$otabek$$,  29940, $$i'm at 230 °C and 60 mm/s$$),
($$m21$$, $$kamila$$,  29910, $$try 245, and orient the part so the load goes across layers instead of pulling them apart. that one change is usually worth more than switching material$$),
($$m22$$, $$rustam$$,  29880, $$or make it out of aluminium and stop thinking about it 😄$$),
($$m23$$, $$otabek$$,  29850, $$not all of us have an uncle with a mill, Rustam$$),
($$m24$$, $$dilnoza$$, 27300, $$does anyone have a sane method for designing a four bar? i've been dragging points around in sketch mode for two evenings$$),
($$m25$$, $$sardor$$,  27270, $$define your two extreme positions first, then solve for the link lengths. if you start by drawing links you're just guessing$$),
($$m26$$, $$dilnoza$$, 27240, $$that is obvious in retrospect. thank you$$),
($$m27$$, $$kamila$$,  24600, $$FEA warning for anyone starting out: if stress keeps climbing every time you refine the mesh at a sharp internal corner, that's a singularity, not a real number. put a fillet on the model and it goes away$$),
($$m28$$, $$sardor$$,  24570, $$we chased a 900 MPa number for a week because of exactly this$$),
($$m29$$, $$kamila$$,  24540, $$and be honest with your constraints. fixing a face rigid in the software when it's really four M4 bolts gives you a beautiful, completely wrong answer$$),
($$m30$$, $$rustam$$,  21800, $$bearing fits, since three people asked me this week: housing bore slightly tight, shaft a slip fit with a retaining ring, otherwise the bearing walks. if the housing is printed, print it 0.1 undersize and ream it$$),
($$m31$$, $$zarina$$,  19000, $$belt or chain for the drive? we've always run chain but it stretches and i spend every competition morning re-tensioning$$),
($$m32$$, $$sardor$$,  18960, $$belt if you can get the tension right at design time — no lubrication, quieter, lighter. chain if you expect shock loads or dirt$$),
($$m33$$, $$zarina$$,  18930, $$the shock load argument is real, someone drove into a wall last year$$),
($$m34$$, $$sardor$$,  17500, $$weight check today: 18.4 kg against a 20 kg limit, and we still have wiring to do 😬$$),
($$m35$$, $$kamila$$,  17470, $$the chassis plates are your easy win. pocket them and you keep nearly all the stiffness — it's in the second moment of area, the material near the neutral axis is barely working$$),
($$m36$$, $$sardor$$,  17440, $$if i cut pockets does your analysis have to be redone?$$),
($$m37$$, $$kamila$$,  17410, $$send me the file, it's 20 minutes$$),
($$m38$$, $$otabek$$,  14600, $$heat set inserts changed my life. no more printed threads stripping on the second assembly$$),
($$m39$$, $$rustam$$,  14570, $$what temperature do you run the iron at?$$),
($$m40$$, $$otabek$$,  14540, $$230 for PLA, slowly, let the insert sink under its own weight. push it and you get a pillow of plastic on top$$),
($$m41$$, $$dilnoza$$, 12000, $$our drive motor was too hot to touch after a two minute match. gearing problem or do we just need a heatsink?$$),
($$m42$$, $$zarina$$,  11970, $$almost always gearing. a hot motor means you're running near stall, which means the ratio is wrong for the load. a heatsink treats the symptom$$),
($$m43$$, $$kamila$$,  11940, $$log the current draw during a match if you can, it answers the question immediately$$),
($$m44$$, $$dilnoza$$, 11910, $$someone in the Software group is already logging motor current, i'll go ask them$$),
($$m45$$, $$rustam$$,  9000,  $$safety thing, because i saw a photo this week: no gloves near a lathe, ever. tie your hair back, roll your sleeves, and never leave the chuck key in the chuck$$),
($$m46$$, $$sardor$$,  8970,  $$seconding this very loudly$$),
($$m47$$, $$sardor$$,  7200,  $$does anyone know a metal shop that sells small quantities of 6061? everywhere i call wants to sell me a 6 metre bar$$),
($$m48$$, $$rustam$$,  7170,  $$there's a place that sells offcuts by weight, i'll send you the contact$$),
($$m49$$, $$zarina$$,  7140,  $$offcuts are how our entire robot is built, honestly$$),
($$m50$$, $$otabek$$,  5000,  $$printed the new gearbox plate overnight. 14 hour print, warped off the bed at hour 12 🙃$$),
($$m51$$, $$kamila$$,  4970,  $$brim, and slow the first layer down. if the plate is that big, split it and pin the halves together$$),
($$m52$$, $$dilnoza$$, 3000,  $$linkage works!! no binding through the full sweep. defining the extremes first was the whole trick$$),
($$m53$$, $$sardor$$,  2970,  $$see, i'm right 20% of the time$$),
($$m54$$, $$zarina$$,  1400,  $$reminder that competition registration closes on the 15th. don't be us last year, submitting at 23:58$$),
($$m55$$, $$rustam$$,  1370,  $$parts are cut for the new chassis. 6061, pocketed, 2.1 kg lighter than last year$$),
($$m56$$, $$kamila$$,  300,   $$morning. mesh convergence on the pocketed plate looks clean, 84 MPa max. we're fine$$),
($$m57$$, $$otabek$$,  120,   $$printer is behaving again. anyone need brackets printed this week? i have free bed time$$),
($$m58$$, $$dilnoza$$, 45,    $$yes please, i'll send you an stl tonight$$);

-- ── Software ────────────────────────────────────────────────────────────────
insert into seed_msg (key, handle, minutes_ago, text) values
($$s01$$, $$aziz$$,    38600, $$hi everyone 👋 Aziz. i write firmware — STM32, ESP32, and a logic analyzer that has saved me more times than i can count$$),
($$s02$$, $$sevara$$,  38560, $$hey! Sevara. front-end. i build the dashboards that you hardware people stare at during tests$$),
($$s03$$, $$bobur$$,   38520, $$hello. Bobur, robotics software, mostly ROS 2 and then debugging why the robot drove into a wall$$),
($$s04$$, $$madina$$,  38480, $$hi all, Madina. data side — i turn SD card logs into plots the team can actually read$$),
($$s05$$, $$aziz$$,    38440, $$how's everyone doing? what are you working on this week?$$),
($$s06$$, $$sevara$$,  38400, $$rewriting our telemetry page for the third time. the first two were also fine, i just have a problem$$),
($$s07$$, $$feruza$$,  38350, $$hey, Feruza. computer vision — line following, object detection, and mostly fighting my own dataset$$),
($$s08$$, $$madina$$,  38310, $$this week i'm just cleaning data. 40 MB of logs where half the timestamps are wrong$$),
($$s09$$, $$ulugbek$$, 38260, $$hi.. i'm Ulugbek, first year. i only really know a bit of Python and some Arduino, so i'm mostly here to read. hope that's ok$$),
($$s10$$, $$aziz$$,    38230, $$completely ok, that's what the group is for. ask things, nobody here started knowing this stuff$$),
($$s11$$, $$bobur$$,   38200, $$genuinely — the questions beginners ask are usually the ones the rest of us stopped asking too early$$),
($$s12$$, $$ulugbek$$, 35000, $$ok first question then. everyone says learn C, but i'm comfortable in Python. is it worth switching?$$),
($$s13$$, $$aziz$$,    34960, $$don't switch, add. Python is right for tooling, data and prototypes. C is what runs on a microcontroller with 64 kB of RAM. they're different jobs, not competitors$$),
($$s14$$, $$madina$$,  34930, $$half my "software work" is a 30 line Python script that turns a log into a graph. that's a real skill, keep it$$),
($$s15$$, $$feruza$$,  34900, $$and if you want to learn C, learn it while making a LED blink and then a sensor read, not from a book of syntax$$),
($$s16$$, $$aziz$$,    32000, $$anyone else fought with I2C this week? sensor answers on the scanner but every read comes back 0xFF$$),
($$s17$$, $$bobur$$,   31970, $$pull-ups? some breakout boards have them, some don't, and two boards in parallel means you have half the resistance you think$$),
($$s18$$, $$aziz$$,    31940, $$it was the pull-ups. 4.7k on both lines and it's stable. i lost an evening to that$$),
($$s19$$, $$feruza$$,  31910, $$the number of hours our whole generation has lost to I2C pull-ups could have built a space program$$),
($$s20$$, $$sevara$$,  29500, $$dashboard question — should the board pull data or should i push it? right now i poll an endpoint every second and it feels wrong$$),
($$s21$$, $$madina$$,  29470, $$a websocket for live values, plus a normal endpoint for history when the page loads. polling for live data burns battery on the board and gets stale anyway$$),
($$s22$$, $$sevara$$,  29440, $$that's the split i was missing, thanks. history on load, socket for the stream$$),
($$s23$$, $$madina$$,  27000, $$one plea to everyone writing loggers: put a monotonic timestamp on every single line. i can fix units, i can fix scaling, i cannot fix "which of these happened first"$$),
($$s24$$, $$aziz$$,    26970, $$millis() since boot is enough. absolute time is a bonus, ordering is the requirement$$),
($$s25$$, $$madina$$,  26940, $$exactly. and CSV over JSON for embedded logs, you'll fit 3x more in the same flash$$),
($$s26$$, $$bobur$$,   24500, $$PID question. my loop is correct on paper but the robot oscillates when it gets close to the target and it's worse when the loop runs faster$$),
($$s27$$, $$aziz$$,    24470, $$are you multiplying by dt? if your gains were tuned at 50 Hz and you moved to 200 Hz without dt in the integral term, everything you tuned is now 4x wrong$$),
($$s28$$, $$bobur$$,   24440, $$....no dt anywhere. that's my whole evening explained$$),
($$s29$$, $$feruza$$,  24410, $$also clamp the integral. windup while the robot is physically blocked is a classic$$),
($$s30$$, $$ulugbek$$, 22000, $$stupid question: what does volatile actually do? i copied it from an example with an interrupt$$),
($$s31$$, $$aziz$$,    21970, $$not stupid. it tells the compiler "this can change behind your back, re-read it every time". without it the compiler may cache the variable in a register and your loop never sees the interrupt update it$$),
($$s32$$, $$ulugbek$$, 21940, $$oh. that explains a bug i had in march and never solved$$),
($$s33$$, $$feruza$$,  19500, $$line following with plain grayscale threshold works great in the lab and dies at competition under different lights. switched to HSV and thresholded on saturation, much more stable$$),
($$s34$$, $$bobur$$,   19470, $$we ended up shielding the camera with a 3D printed hood and adding our own LED. controlling the light is easier than being robust to every light$$),
($$s35$$, $$feruza$$,  19440, $$"control the light instead of being robust to it" is going in my notes$$),
($$s36$$, $$aziz$$,    17000, $$someone from Aerospace asked me about SD logging so i'll put it here too: call flush() after each write. if power drops mid-flight and you never flushed, your card has a beautiful empty file$$),
($$s37$$, $$madina$$,  16970, $$i have received so many beautiful empty files$$),
($$s38$$, $$bobur$$,   16940, $$and write a header line with the column names. future you is a different person with no memory$$),
($$s39$$, $$sevara$$,  14500, $$is anyone else in this group doing web? i feel like i'm the only one not talking to hardware$$),
($$s40$$, $$madina$$,  14470, $$i'm half web, the plotting side. and honestly the dashboard is the part mentors actually see, it's not a side quest$$),
($$s41$$, $$feruza$$,  14440, $$our last competition score was partly "they could explain their data". that was Sevara's page doing the explaining$$),
($$s42$$, $$ulugbek$$, 12000, $$i broke my repo. i committed on top of a merge conflict and now main has both versions of the file 😭$$),
($$s43$$, $$bobur$$,   11970, $$don't panic, nothing is lost. git log --oneline, find the last good commit, branch from it. git basically never deletes anything you committed$$),
($$s44$$, $$ulugbek$$, 11940, $$branched from the good commit and it works again. thank you, i genuinely thought i'd lost two weeks$$),
($$s45$$, $$aziz$$,    11910, $$commit small and commit often. that's the whole lesson from this$$),
($$s46$$, $$madina$$,  9500,  $$someone in Mechanical asked about logging motor current — an INA219 on the motor line, 10 Hz, straight to CSV. it will show you the stall spikes clearly$$),
($$s47$$, $$feruza$$,  9470,  $$i love that this place cross-pollinates like this$$),
($$s48$$, $$bobur$$,   7000,  $$ROS 2 tip: if your transforms look right in RViz but the robot behaves wrong, check your frame timestamps before you check your maths. 90% of the time it's stale tf$$),
($$s49$$, $$aziz$$,    5000,  $$watchdog timers. use them. a board that resets in 2 seconds is infinitely better than a board that hangs and you find out after the flight$$),
($$s50$$, $$sevara$$,  4970,  $$is that also why my board sometimes reboots during a long computation? 😅$$),
($$s51$$, $$aziz$$,    4940,  $$yes — feed the watchdog inside long loops, or make the loop shorter$$),
($$s52$$, $$feruza$$,  3000,  $$got the model running on the ESP32-CAM. 8 fps, which sounds bad until you remember what the board costs$$),
($$s53$$, $$madina$$,  2970,  $$8 fps is completely fine for line following, the robot isn't moving that fast$$),
($$s54$$, $$ulugbek$$, 1400,  $$made my first pull request to the team repo today. it was 4 lines and i re-read it 10 times before pressing the button$$),
($$s55$$, $$sevara$$,  1370,  $$that's how everyone's first one goes. congrats 🎉$$),
($$s56$$, $$bobur$$,   350,   $$morning. rewriting the nav node so it stops planning through walls. wish me luck$$),
($$s57$$, $$aziz$$,    130,   $$new firmware build is flashing clean, 2.1 kB smaller. i removed one printf$$),
($$s58$$, $$madina$$,  40,    $$if anyone has a messy log they want plotted, send it over. i find it relaxing, which probably says something about me$$);

-- ── Environmental ───────────────────────────────────────────────────────────
insert into seed_msg (key, handle, minutes_ago, text) values
($$e01$$, $$gulnora$$,  36000, $$salom everyone! Gulnora. i work on low cost water filters — mostly for wells in my grandmother's village$$),
($$e02$$, $$javohir$$,  35960, $$hi! Javohir. air quality. i have four PM2.5 sensors around my district and a spreadsheet that is getting out of hand$$),
($$e03$$, $$anvar$$,    35920, $$hello. Anvar, from Nukus. irrigation and soil salinity. here that isn't a school topic, it's what you can see from the window$$),
($$e04$$, $$gulnora$$,  35880, $$welcome Anvar. how is everyone doing this week?$$),
($$e05$$, $$shahzoda$$, 35840, $$hey all, Shahzoda. solar panels and energy efficiency. doing fine, mostly tired, we had three tests in two days$$),
($$e06$$, $$mirjalol$$, 35800, $$hi! Mirjalol. waste and recycling. currently building a plastic shredder that is much louder than i expected$$),
($$e07$$, $$nodira$$,   35760, $$hello everyone, Nodira. i do the data side — soil salinity measurements and maps. so Anvar and i will probably talk a lot$$),
($$e08$$, $$javohir$$,  35720, $$what is everyone working on right now? i'm trying to figure out whether my sensors are even telling the truth$$),
($$e09$$, $$gulnora$$,  35680, $$a three stage filter: gravel, sand, activated carbon. it makes cloudy water clear, which is exactly the part i don't trust$$),
($$e10$$, $$anvar$$,    35640, $$mapping which fields near us have gone saline. so far: more than i expected$$),
($$e11$$, $$gulnora$$,  33000, $$serious question for the group. my filter drops turbidity from 40 NTU to about 3. can i say the water is safe to drink?$$),
($$e12$$, $$nodira$$,   32960, $$no. clear is not the same as safe. turbidity is one parameter, and it says nothing about bacteria, nitrate or heavy metals$$),
($$e13$$, $$javohir$$,  32930, $$this is important, half of school projects claim "clean drinking water" from a clarity test$$),
($$e14$$, $$gulnora$$,  32900, $$so what do i actually say?$$),
($$e15$$, $$nodira$$,   32870, $$say exactly what you measured. "reduces turbidity from 40 to 3 NTU" is a real result and it's honest. if you want to claim potability you need a lab, and there are labs that will run a sample for students$$),
($$e16$$, $$gulnora$$,  32840, $$ok. rewriting my whole poster tonight, but you're right$$),
($$e17$$, $$anvar$$,    30500, $$Nodira, what do you use for salinity? we have a cheap EC meter but the numbers move depending on how i mix the sample$$),
($$e18$$, $$nodira$$,   30470, $$fix the method and the numbers stop moving: 1 part soil to 5 parts distilled water by weight, shake for 30 minutes, let it settle, then read. same ratio every single time or nothing is comparable$$),
($$e19$$, $$anvar$$,    30440, $$we were doing it by eye with tap water 🙃$$),
($$e20$$, $$nodira$$,   30410, $$tap water has its own EC, so you were measuring your tap plus the soil. distilled only, and measure a blank first$$),
($$e21$$, $$javohir$$,  28000, $$my PM2.5 readings jump every morning around 7 and i can't tell if that's traffic or fog. the cheap sensors read humidity as particles$$),
($$e22$$, $$shahzoda$$, 27970, $$do you log humidity next to it?$$),
($$e23$$, $$javohir$$,  27940, $$i do actually. so i can check the correlation$$),
($$e24$$, $$nodira$$,   27910, $$if PM spikes only when RH goes above ~80% it's mostly hygroscopic growth, not real mass. there are correction formulas, but at minimum flag high humidity readings in your data instead of deleting them$$),
($$e25$$, $$javohir$$,  27880, $$flagging rather than deleting, noted$$),
($$e26$$, $$shahzoda$$, 25000, $$dust measurement of my own: our panels lose about 12% output after two weeks without rain. i measured with a shunt and a cheap logger$$),
($$e27$$, $$mirjalol$$, 24970, $$12% is a lot. how often does washing pay for itself?$$),
($$e28$$, $$shahzoda$$, 24940, $$that's the actual project — water cost and labour against energy recovered. so far cleaning every 10 days wins in summer, but i want a month of data before i claim anything$$),
($$e29$$, $$nodira$$,   24910, $$a month of data before claiming anything. i want that on a poster in every school lab$$),
($$e30$$, $$mirjalol$$, 22000, $$shredder update: it works on PET bottles. it also fills the room with a smell i don't like$$),
($$e31$$, $$gulnora$$,  21970, $$please don't melt anything indoors without ventilation. PET is not the worst but PVC gives off HCl and you won't get a warning you'll like$$),
($$e32$$, $$mirjalol$$, 21940, $$shredding only, no melting yet. but i'll move the whole thing to the balcony and sort out what's actually in the plastic first$$),
($$e33$$, $$anvar$$,    19500, $$drip versus furrow, for anyone who has actually measured: our neighbours flood the whole field and the water table keeps rising, which is half the salinity problem$$),
($$e34$$, $$nodira$$,   19470, $$that's the mechanism, yes — over-irrigation raises the water table, capillary action brings salts up, evaporation leaves them at the surface$$),
($$e35$$, $$anvar$$,    19440, $$so the fix is less water, more precisely placed. drip is expensive here though$$),
($$e36$$, $$shahzoda$$, 19410, $$is there a middle option? alternate furrow irrigation or something$$),
($$e37$$, $$anvar$$,    19380, $$alternate furrow is real and cheap, people just don't trust it until they see a yield number$$),
($$e38$$, $$javohir$$,  17000, $$moisture sensor question — my resistive probes read fine for two weeks then drift badly$$),
($$e39$$, $$anvar$$,    16970, $$they corrode. resistive probes are electrodes sitting in wet soil with a DC voltage on them. get capacitive ones, they're barely more expensive and they last$$),
($$e40$$, $$javohir$$,  16940, $$ordering capacitive today then$$),
($$e41$$, $$gulnora$$,  14500, $$biosand filter update: the biolayer takes about 2 weeks to establish and it makes a real difference to the coliform result. so patience is a design parameter$$),
($$e42$$, $$nodira$$,   14470, $$did the lab run your samples?$$),
($$e43$$, $$gulnora$$,  14440, $$yes, the university sanitary lab did three for free because we're students. i'm going to put the actual numbers in the report, including the one that failed$$),
($$e44$$, $$nodira$$,   14410, $$including the failure is what makes the rest believable$$),
($$e45$$, $$mirjalol$$, 12000, $$we started composting the canteen waste at school. it smells bad, which apparently means i got the ratio wrong$$),
($$e46$$, $$gulnora$$,  11970, $$too much nitrogen. add dry leaves, cardboard, straw — roughly 25-30 parts carbon to 1 nitrogen. and turn it, it's probably going anaerobic$$),
($$e47$$, $$mirjalol$$, 11940, $$carbon it is. the canteen is producing an unlimited supply of cardboard boxes anyway$$),
($$e48$$, $$shahzoda$$, 9500,  $$rainwater question: our school roof is about 600 m². is that worth harvesting or am i doing arithmetic for fun?$$),
($$e49$$, $$nodira$$,   9470,  $$600 m² × annual rainfall in metres × ~0.8 runoff coefficient. even at 300 mm that's roughly 140 m³ a year. not nothing, especially for irrigating the school garden$$),
($$e50$$, $$shahzoda$$, 9440,  $$140 tonnes of water we currently send into a drain. ok, that's a project$$),
($$e51$$, $$anvar$$,    7000,  $$dust storm here yesterday, the sky was orange by 4pm. this is the Aral doing what everyone said it would do$$),
($$e52$$, $$javohir$$,  6970,  $$my sensors saw it too, 300 km away. PM10 was up all evening$$),
($$e53$$, $$nodira$$,   6940,  $$if you two put your data side by side with dates that's a genuinely useful figure. local source, regional effect$$),
($$e54$$, $$anvar$$,    6910,  $$let's do it. i have the local readings and the salinity map already$$),
($$e55$$, $$gulnora$$,  3000,  $$we're entering the Conrad Challenge with the filter. deadline is end of october and i'm already nervous$$),
($$e56$$, $$mirjalol$$, 2970,  $$lead with the lab numbers, not the photos of clear water. that's the part judges will actually push on$$),
($$e57$$, $$javohir$$,  400,   $$morning everyone. the new capacitive sensors arrived, installing them at three sites today$$),
($$e58$$, $$nodira$$,   150,   $$salinity map has 60 points now. if anyone in the Software group wants to help me put it on a real map instead of a spreadsheet, i'd owe you$$),
($$e59$$, $$shahzoda$$, 50,    $$panels cleaned this morning, output back to 4.1 kW from 3.6. two weeks of dust, measured properly this time$$);

-- ── 6. Replies ──────────────────────────────────────────────────────────────
-- Threaded replies (question_comments), i.e. the "N" behind the comment icon.
-- The FK to seed_msg means a typo in a message key fails here instead of
-- silently dropping a reply.
create temporary table seed_reply (
  msg_key     text not null references seed_msg(key),
  handle      text not null references seed_bot(handle),
  minutes_ago int  not null,
  text        text not null
);

insert into seed_reply (msg_key, handle, minutes_ago, text) values
-- Aerospace
($$a09$$, $$malika$$,  34100, $$1 km with a ~700 g rocket is roughly a mid H. simulate before you buy anything$$),
($$a19$$, $$nilufar$$, 29900, $$we tied a bright ribbon to the drogue line. finding it in tall grass got about ten times easier$$),
($$a23$$, $$bekzod$$,  27100, $$we moved to 2 mm G10 this year. expensive, but zero twist so far$$),
($$a28$$, $$aziz$$,    24200, $$if you're on an ESP32: sample the barometer on a timer interrupt and filter in the main loop, not the other way round$$),
($$a37$$, $$malika$$,  18700, $$i have a spreadsheet that does this, i'll drop it in Discussion$$),
($$a44$$, $$timur$$,   14300, $$what rate did you log the load cell at? below 200 Hz you'll miss the ignition peak entirely$$),
($$a52$$, $$nilufar$$, 10000, $$the recording usually shows up a couple of days later, i'll post the link here$$),
($$a56$$, $$bekzod$$,  7100,  $$a 2 m rail also means a roof rack. ask me how i know$$),
($$a64$$, $$nilufar$$, 2800,  $$we'll bring the payload for a ride along if you have space in the bay$$),
($$a69$$, $$daniyar$$, 300,   $$good luck! post the flight card afterwards$$),
-- Mechanical
($$m11$$, $$sardor$$,  33800, $$we wrote a drawing checklist after this conversation. it's five lines and it works$$),
($$m14$$, $$dilnoza$$, 31200, $$also check the gearbox itself can take the output torque, not just the motor$$),
($$m18$$, $$otabek$$,  29700, $$update: 245 °C and slower first layers and my brackets stopped snapping$$),
($$m27$$, $$kamila$$,  24300, $$if anyone wants a worked example i can screenshot our arm study with the fillet added$$),
($$m30$$, $$sardor$$,  21500, $$print undersize and ream is the single most useful thing i've read in this group$$),
($$m34$$, $$rustam$$,  17200, $$swapping steel standoffs for aluminium saves a surprising amount too$$),
($$m41$$, $$bobur$$,   11800, $$we logged ours with an INA219 and it was 100% gearing, not cooling$$),
($$m45$$, $$zarina$$,  8800,  $$and safety glasses, even for "just one quick cut"$$),
($$m50$$, $$otabek$$,  4800,  $$reprinted it in two halves, 6 hours each, no warp$$),
($$m54$$, $$sardor$$,  1200,  $$registration submitted. thirteen days early. i'm a changed man$$),
-- Software
($$s12$$, $$madina$$,  34700, $$and learn to read documentation properly. that's the actual meta skill$$),
($$s16$$, $$aziz$$,    31700, $$the logic analyzer paid for itself in one evening on this bug$$),
($$s23$$, $$sevara$$,  26800, $$from the dashboard side: if the timestamps are monotonic i can plot it. if they aren't, i can't$$),
($$s26$$, $$bobur$$,   24200, $$with dt in the integral and the term clamped it's stable at 200 Hz now. thank you both$$),
($$s33$$, $$feruza$$,  19200, $$also take training images at the actual venue if you can. even twenty photos help a lot$$),
($$s42$$, $$aziz$$,    11700, $$git reflog is the other lifesaver — it remembers even the things you think you deleted$$),
($$s46$$, $$madina$$,  9200,  $$sample at 10 Hz minimum, the stall spikes are short$$),
($$s49$$, $$bobur$$,   4800,  $$our ROS node has one and it saved an entire test day once$$),
($$s54$$, $$ulugbek$$, 1200,  $$it got merged 😄$$),
($$s58$$, $$sevara$$,  20,    $$sending you the messy one from friday$$),
-- Environmental
($$e11$$, $$gulnora$$,  32700, $$the university sanitary lab ran ours for free — ask them, they're used to students$$),
($$e17$$, $$nodira$$,   30200, $$record the temperature too. EC changes with it, so report against a 25 °C reference or your numbers drift$$),
($$e21$$, $$javohir$$,  27700, $$correlation came out at 0.71 for RH above 80%. so yes, mostly water$$),
($$e26$$, $$shahzoda$$, 24700, $$week three: 11.4% average loss. holding up so far$$),
($$e30$$, $$mirjalol$$, 21700, $$moved it outside. the neighbours now know exactly what i'm building$$),
($$e41$$, $$gulnora$$,  14200, $$two weeks of deliberately doing nothing was the hardest engineering i've done$$),
($$e48$$, $$nodira$$,   9200,  $$check the roof material as well, some coatings you don't want ending up in irrigation water$$),
($$e51$$, $$anvar$$,    6800,  $$schools closed early that day. everyone here has a theory about the cause and most of them are right$$),
($$e55$$, $$nodira$$,   2800,  $$send me the draft, i'll read it specifically for the claims$$),
($$e58$$, $$nodira$$,   60,    $$a map library and a csv is probably all it needs, i just don't know where to start$$);

-- ── 7. Write the feed ───────────────────────────────────────────────────────
insert into questions (id, discipline, author_id, text, created_at)
select m.qid, b.discipline, b.id, m.text, now() - make_interval(mins => m.minutes_ago)
from seed_msg m
join seed_bot b on b.handle = m.handle;

insert into question_comments (question_id, author_id, text, created_at)
select m.qid, b.id, r.text, now() - make_interval(mins => r.minutes_ago)
from seed_reply r
join seed_msg m on m.key = r.msg_key
join seed_bot b on b.handle = r.handle;

-- ── 8. Votes ────────────────────────────────────────────────────────────────
-- Deterministic rather than random, so a re-run produces the same feed. The
-- threshold scales with message length as a rough proxy for "this one was
-- worth agreeing with" — a hello gets a couple of thumbs, a worked answer
-- gets most of the group. Disapprovals stay rare, which is what a group of
-- people who like each other actually looks like.
insert into question_votes (question_id, user_id, vote)
select
  m.qid,
  peer.id,
  (case when (hashtext(m.key || peer.handle || $$vote$$) % 100 + 100) % 100 < 4
        then $$disapprove$$ else $$approve$$ end)::app.vote
from seed_msg m
join seed_bot author on author.handle = m.handle
join seed_bot peer   on peer.discipline = author.discipline and peer.handle <> m.handle
where (hashtext(m.key || peer.handle) % 100 + 100) % 100 <
      (case when length(m.text) > 140 then 60
            when length(m.text) > 80  then 35
            else 18 end)
on conflict do nothing;

-- ── 9. Connections ──────────────────────────────────────────────────────────
-- People who talk in the same group tend to be connected. a.handle < b.handle
-- keeps one row per pair, matching the unique (requester, addressee) pair.
insert into connections (requester_id, addressee_id, status, created_at)
select a.id, b.id, $$connected$$::app.connection_status, now() - make_interval(days => 12)
from seed_bot a
join seed_bot b on b.discipline = a.discipline and a.handle < b.handle
where (hashtext(a.handle || b.handle) % 100 + 100) % 100 < 70
on conflict do nothing;

-- The cross-discipline ones are named rather than generated — these are the
-- pairs the conversation itself refers to (avionics ↔ firmware, and so on).
insert into connections (requester_id, addressee_id, status, created_at)
select x.id, y.id, $$connected$$::app.connection_status, now() - make_interval(days => 6)
from (values
  ($$timur$$,    $$aziz$$),
  ($$nilufar$$,  $$madina$$),
  ($$dilnoza$$,  $$nodira$$),
  ($$sardor$$,   $$bobur$$),
  ($$jasur$$,    $$otabek$$),
  ($$kamila$$,   $$shahzoda$$),
  ($$anvar$$,    $$nodira$$)
) as pair(a, b)
join seed_bot x on x.handle = pair.a
join seed_bot y on y.handle = pair.b
on conflict do nothing;

-- ── 10. Done ────────────────────────────────────────────────────────────────
drop table seed_reply;
drop table seed_msg;
drop table seed_bot;

commit;

-- What landed, per group. Run on its own any time to check the seed is intact.
select
  q.discipline,
  count(distinct q.author_id)                                        as members_posting,
  count(*)                                                           as messages,
  (select count(*) from question_comments c where c.question_id in
     (select id from questions q2 where q2.discipline = q.discipline)) as replies,
  min(q.created_at)::date                                            as first_message,
  max(q.created_at)::date                                            as last_message
from questions q
group by q.discipline
order by q.discipline;
