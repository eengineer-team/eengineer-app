-- ============================================================================
-- eengineer — reference-data seed (public, non-user rows). Applied live to
-- bgdlpdokubhutwicsfyp. Safe to re-run: truncates these tables first.
-- Note: `profiles` and other user data are NOT seeded — the Builder directory
-- fills as real people sign up (honest empty start).
-- Opportunities are seeded by Claude Code once the opportunities table is
-- widened to match the frontend model (requirements/responsibilities/image/url).
-- ============================================================================
truncate table competitions restart identity cascade;
truncate table webinars restart identity cascade;

insert into competitions (name, location, remote, discipline, organizer, description, requirements, deadline) values
($$Conrad Challenge$$, $$International$$, true, $$All disciplines$$, $$Conrad Challenge Foundation$$,
 $$A year-long innovation competition where student teams design a product or service addressing a real-world problem across categories spanning aerospace, cyber, energy, and more.$$,
 array[$$Team of 2–5 students, ages 13–18$$, $$Original concept — not a prior year resubmission$$, $$Written proposal and pitch deck at each submission stage$$], timestamptz $$2026-10-30$$),
($$MIT Beaverworks Summer Institute$$, $$Cambridge, MA$$, false, $$Robotics / Aerospace$$, $$MIT Lincoln Laboratory Beaver Works Center$$,
 $$A four-week residential program where high school students build autonomous systems (UAVs or medical devices) under the mentorship of MIT researchers and engineers.$$,
 array[$$Rising junior or senior in high school$$, $$Prior coursework or project experience in programming (Python or C++)$$, $$Teacher recommendation and application essay$$], timestamptz $$2027-04-15$$),
($$NASA L'SPACE Academy$$, $$Remote$$, true, $$Aerospace / Systems$$, $$NASA / Arizona State University$$,
 $$A semester-long, remote-only program simulating a real aerospace engineering proposal team, culminating in a mission concept review with NASA subject matter experts.$$,
 array[$$High school student, 16 years or older$$, $$Interest in systems engineering or mission design$$, $$Reliable internet access for weekly virtual team meetings$$], timestamptz $$2026-08-25$$);

insert into webinars (title, speaker, discipline, starts_at, tz_label) values
($$Aerospace Propulsion Systems$$, $$Dr. Elena Vasquez, JPL$$, $$Aerospace$$, timestamptz $$2026-07-17T21:00:00Z$$, $$UTC$$),
($$Building Reliable Firmware-to-Cloud Pipelines$$, $$Marcus Chen, Software Lead @ Anduril$$, $$Software$$, timestamptz $$2026-07-21T22:00:00Z$$, $$UTC$$),
($$Design for Additive Manufacturing$$, $$Rina Osei, Mechanical Engineer @ Boom Supersonic$$, $$Mechanical$$, timestamptz $$2026-07-23T21:30:00Z$$, $$UTC$$),
($$Power Electronics for Small UAVs$$, $$Tomás Ferreira, EE @ Skydio$$, $$Electrical$$, timestamptz $$2026-08-03T22:00:00Z$$, $$UTC$$);

truncate table opportunities restart identity cascade;
insert into opportunities
  (title, organization, discipline, location, description, requirements, responsibilities, apply_url, source, deadline_label, deadline)
values
($$IAESTE Technical Internship Exchange$$, $$IAESTE$$, null, $$International (paid placement)$$,
 $$IAESTE is the world's largest paid technical-internship exchange, matching engineering and STEM students with placements abroad in fields spanning mechanical, civil, chemical, and computer engineering. Uzbekistan is a member country — students nominate through the national committee rather than applying to a single employer, and every placement is paid at least enough to cover food, housing, and local travel.$$,
 array[$$Enrolled full-time in a Bachelor's or Master's program (engineering, CS, or related STEM field)$$, $$Nomination through your home country's IAESTE committee — Uzbekistan is a member country$$, $$Basic English or the host country's working language, depending on placement$$],
 array[$$Register on the IAESTE Exchange Platform and submit a nomination$$, $$Complete required documents: CV, transcript, enrollment certificate, and recommendation letter$$, $$Take on a real paid technical role for the placement term (typically 8–52 weeks)$$],
 $$https://iaeste.org/member-countries/uzbekistan$$, $$edugrants$$, $$Rolling — apply each semester via the Uzbekistan committee$$, null),
($$DAAD EPOS Scholarship — Engineering Master's$$, $$DAAD (German Academic Exchange Service)$$, $$Civil$$, $$Germany (fully funded master's)$$,
 $$DAAD's Development-Related Postgraduate Courses (EPOS) program funds master's and PhD study in Germany for students from Eastern Europe and Central Asia, including Uzbekistan. Engineering-relevant tracks include Structural Engineering, Urban Management, and Renewable Energy — funding covers tuition, a monthly stipend (~€992), travel, and health insurance.$$,
 array[$$Bachelor's degree in engineering or a related field, completed within the last 6 years$$, $$At least 2 years of relevant professional experience for most tracks$$, $$Uzbekistan is an eligible country under DAAD's Central Asia region$$],
 array[$$Apply directly to your chosen course's host university, not to DAAD centrally$$, $$Submit transcripts, references, and a motivation letter per the program's own deadline$$, $$Attend the full master's or PhD program in Germany if selected$$],
 $$https://www.daad.de/en/$$, $$edugrants$$, $$Applications close Aug 31$$, timestamptz $$2026-08-31$$),
($$Turkiye Burslari (Turkiye Scholarships) — Engineering$$, $$Turkiye Scholarships / Turkish Government$$, null, $$Turkiye (fully funded, bachelor's–PhD)$$,
 $$Turkiye Burslari is the Turkish government's fully funded scholarship for international students, open to bachelor's, master's, and doctoral applicants — Uzbekistan students are explicitly eligible. Engineering is one of the largest fields covered, with placements across Turkey's top public universities. Funding includes tuition, monthly stipend, housing, health insurance, and a Turkish-language prep year if needed.$$,
 array[$$Uzbek or other international citizenship (not a Turkish citizen)$$, $$Minimum GPA thresholds by degree level (check current cycle's announcement)$$, $$Under the age limit for your chosen degree level$$],
 array[$$Apply online through the Turkiye Scholarships portal during the application window$$, $$Rank preferred universities and engineering programs$$, $$Complete a Turkish-language preparatory year if your program requires it$$],
 $$https://tbbs.turkiyeburslari.gov.tr/$$, $$edugrants$$, $$Applications typically open Jan–Feb (2027 cycle dates TBA)$$, timestamptz $$2027-02-20$$),
($$El-Yurt Umidi Presidential Scholarship$$, $$El-Yurt Umidi Foundation (Uzbekistan)$$, null, $$Study abroad — top 300 QS-ranked universities$$,
 $$El-Yurt Umidi is the Uzbek government's own presidential scholarship fund, sending Uzbek students abroad for bachelor's, master's, and PhD study at universities ranked in the global top 300 — engineering disciplines are fully eligible. Selection runs through a national competition: testing, interviews, and an assessment of intellectual and creative ability.$$,
 array[$$Uzbek citizenship$$, $$Admission (or a plan to secure admission) to a university in the global top 300, or top 100 in your field$$, $$Pass the Fund's competitive testing and interview stages$$],
 array[$$Submit an application through the Fund's official site during the annual window$$, $$Complete testing and interview stages assessing academic readiness$$, $$Maintain the Fund's academic standards for the duration of the scholarship$$],
 $$https://eyuf.uz$$, $$edugrants$$, $$Applications typically open Apr 15 – May 15 (2027 cycle TBA)$$, timestamptz $$2027-05-15$$),
($$Chevening Scholarship — Master's in the UK$$, $$Chevening (UK FCDO)$$, null, $$United Kingdom (fully funded master's)$$,
 $$Chevening is the UK government's flagship scholarship for future leaders, funding a one-year master's degree at any UK university — including engineering programs. Uzbekistan has its own active Chevening alumni network. Awards cover tuition, a monthly stipend, and travel to and from the UK.$$,
 array[$$Uzbek citizenship (or another Chevening-eligible country)$$, $$At least 2 years of full-time work experience after your undergraduate degree$$, $$An undergraduate degree that qualifies you for a UK master's program, plus 3 course choices$$],
 array[$$Apply online during the annual application window (opens each August)$$, $$Complete interviews if shortlisted by the local British Embassy panel$$, $$Return to Uzbekistan after the master's, per Chevening's program terms$$],
 $$https://www.chevening.org/scholarship/uzbekistan/$$, $$edugrants$$, $$Applications close Oct 6$$, timestamptz $$2026-10-06$$),
($$Cross-Discipline Systems Engineering Fellowship$$, $$edugrants Foundation$$, null, $$Remote$$,
 $$A cross-discipline fellowship run directly by the edugrants Foundation rather than a single partner company. Fellows shadow systems engineers across several partner companies at once, producing requirement-traceability writeups for real subsystems — good preparation for anyone whose project work already spans more than one discipline.$$,
 array[$$Any engineering discipline, sophomore standing or above$$, $$Demonstrated project work spanning more than one subsystem$$, $$Strong written communication — the fellowship is documentation-heavy$$],
 array[$$Shadow systems engineers across partner companies$$, $$Produce requirement-traceability writeups for a real subsystem$$, $$Present findings at the fellowship capstone review$$],
 null, $$edugrants$$, $$Applications close Sep 1$$, timestamptz $$2026-09-01$$);
