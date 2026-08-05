-- ==========================================
-- Skillora / EduSync Supabase Database Schema
-- ==========================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES Table (Extends Supabase Auth users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  focus_domain text default 'Mobile',
  proficiency text default 'Beginner',
  learning_hours integer default 5,
  streak integer default 0,
  courses_completed integer default 0,
  career_fit_score integer default 0,
  xp integer default 0,
  last_survey_date timestamp with time zone,
  last_active_date timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Row Level Security (RLS) for Profiles
alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile" 
  on public.profiles for select 
  using (auth.role() = 'authenticated');

-- Trigger to sync auth users to public profiles table automatically on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, focus_domain, proficiency, learning_hours, streak, courses_completed, career_fit_score, xp)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'Mobile',
    'Beginner',
    5,
    1,
    0,
    0,
    100
  )
  on conflict (id) do update
  set email = excluded.email,
      name = coalesce(excluded.name, public.profiles.name);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

-- 2. COURSES Table (All learning pathway courses)
create table if not exists public.courses (
  id serial primary key,
  title text not null,
  subject text not null,
  progress integer default 0,
  time text not null,
  difficulty text not null, -- Beginner, Intermediate, Advanced
  ai boolean default false,
  colors text[] not null,
  url text,
  focus_domain text not null -- Frontend, Backend, Mobile, AI
);

alter table public.courses enable row level security;
drop policy if exists "Anyone can view courses" on public.courses;
create policy "Anyone can view courses" on public.courses for select using (true);

-- 3. RESOURCES Table
create table if not exists public.resources (
  id text primary key,
  title text not null,
  subject text not null,
  level text not null,
  type text not null,
  rating numeric(3, 1) default 4.5,
  downloads integer default 0,
  trending boolean default false,
  author text default 'EduSync AI Coach',
  focus_domain text not null
);

alter table public.resources enable row level security;
drop policy if exists "Anyone can view resources" on public.resources;
create policy "Anyone can view resources" on public.resources for select using (true);

-- 4. MILESTONES Table
create table if not exists public.milestones (
  id serial primary key,
  title text not null,
  description text not null,
  status text not null, -- completed, active, locked
  focus_domain text not null
);

alter table public.milestones enable row level security;
drop policy if exists "Anyone can view milestones" on public.milestones;
create policy "Anyone can view milestones" on public.milestones for select using (true);

-- 5. ASSESSMENTS Table (User-specific assessments)
create table if not exists public.assessments (
  id text not null,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  type text not null,
  subject text not null,
  difficulty text not null,
  deadline text not null,
  skills text[] not null,
  progress integer default 0,
  status text not null, -- open, in-progress, submitted
  questions jsonb,
  responses jsonb,
  primary key (id, user_id)
);

alter table public.assessments enable row level security;
drop policy if exists "Users can query their own assessments" on public.assessments;
create policy "Users can query their own assessments" on public.assessments for select using (auth.uid() = user_id);
drop policy if exists "Users can modify their own assessments" on public.assessments;
create policy "Users can modify their own assessments" on public.assessments for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own assessments" on public.assessments;
create policy "Users can update their own assessments" on public.assessments for update using (auth.uid() = user_id);

-- 6. CONTACTS Table
create table if not exists public.contacts (
  id text primary key,
  name text not null,
  role text not null,
  initials text not null,
  online boolean default false,
  last text,
  unread integer default 0,
  colors text[] not null,
  focus_domain text not null
);

alter table public.contacts enable row level security;
drop policy if exists "Anyone can view contacts" on public.contacts;
create policy "Anyone can view contacts" on public.contacts for select using (true);

-- 7. MESSAGES Table (User messages)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  contact_id text references public.contacts(id) on delete cascade not null,
  "from" text not null, -- me, them
  text text not null,
  created_at timestamp with time zone default now()
);

alter table public.messages enable row level security;
drop policy if exists "Users can view their own messages" on public.messages;
create policy "Users can view their own messages" on public.messages for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own messages" on public.messages;
create policy "Users can insert their own messages" on public.messages for insert with check (auth.uid() = user_id);

-- 8. EVALUATIONS Table (Grading sheets)
create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  assessment_id text not null,
  assessment_title text not null,
  score integer not null,
  max_score integer not null,
  mentor text not null,
  ai_feedback text not null,
  rubric jsonb not null,
  answers jsonb not null,
  subjects jsonb not null,
  percentile_rank text not null
);

alter table public.evaluations enable row level security;
drop policy if exists "Users can view their own evaluations" on public.evaluations;
create policy "Users can view their own evaluations" on public.evaluations for select using (auth.uid() = user_id);
drop policy if exists "Users can insert/update their own evaluations" on public.evaluations;
create policy "Users can insert/update their own evaluations" on public.evaluations for insert with check (auth.uid() = user_id);

-- 9. CAREER SUGGESTIONS Table
create table if not exists public.career_suggestions (
  id serial primary key,
  focus_domain text not null,
  role text not null,
  match integer not null,
  skills text[] not null
);

alter table public.career_suggestions enable row level security;
drop policy if exists "Anyone can view career suggestions" on public.career_suggestions;
create policy "Anyone can view career suggestions" on public.career_suggestions for select using (true);

-- 10. PERFORMANCE TRENDS Table
create table if not exists public.performance_trends (
  id serial primary key,
  user_id uuid references auth.users on delete cascade not null,
  proficiency text not null,
  data integer[] not null,
  avg_score integer not null
);

alter table public.performance_trends enable row level security;
drop policy if exists "Users can view their own trends" on public.performance_trends;
create policy "Users can view their own trends" on public.performance_trends for select using (auth.uid() = user_id);

-- 11. WEAK AREAS Table
create table if not exists public.weak_areas (
  id serial primary key,
  focus_domain text not null,
  topic text not null,
  score integer not null
);

alter table public.weak_areas enable row level security;
drop policy if exists "Anyone can view weak areas" on public.weak_areas;
create policy "Anyone can view weak areas" on public.weak_areas for select using (true);

-- 12. GRIEVANCES Table
create table if not exists public.grievances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  assessment_id text not null,
  assessment_title text not null,
  reason text not null,
  ref_no text not null,
  created_at timestamp with time zone default now()
);

alter table public.grievances enable row level security;
drop policy if exists "Users can view their own grievances" on public.grievances;
create policy "Users can view their own grievances" on public.grievances for select using (auth.uid() = user_id);
drop policy if exists "Users can file grievances" on public.grievances;
create policy "Users can file grievances" on public.grievances for insert with check (auth.uid() = user_id);


-- ==========================================
-- SEED DATA INSERTS
-- ==========================================

-- Courses
insert into public.courses (title, subject, progress, time, difficulty, ai, colors, url, focus_domain) values
('HTML5, CSS3, & Modern Grid', 'Web Basics', 0, '15 hrs', 'Beginner', true, array['#6366f1', '#818cf8'], null, 'Frontend'),
('JavaScript Fundamentals & DOM', 'JS Core', 0, '22 hrs', 'Beginner', false, array['#f59e0b', '#fbbf24'], null, 'Frontend'),
('Intro to React & Component States', 'React Framework', 0, '18 hrs', 'Beginner', true, array['#0ea5e9', '#38bdf8'], null, 'Frontend'),
('React Router & Global Context', 'React Architecture', 0, '14 hrs', 'Intermediate', true, array['#6366f1', '#818cf8'], null, 'Frontend'),
('Tailwind CSS & Responsive Layouts', 'Styling Systems', 0, '8 hrs', 'Intermediate', false, array['#0d9488', '#2dd4bf'], null, 'Frontend'),
('TypeScript Essentials for Web', 'Typed Systems', 0, '16 hrs', 'Intermediate', true, array['#2563eb', '#60a5fa'], null, 'Frontend'),
('Next.js 14 App Router Mastery', 'Production Frameworks', 0, '25 hrs', 'Advanced', true, array['#6366f1', '#818cf8'], null, 'Frontend'),
('Web Performance & Core Web Vitals', 'Performance', 0, '12 hrs', 'Advanced', false, array['#0d9488', '#2dd4bf'], null, 'Frontend'),
('Module Federation & Micro-Frontends', 'Web Architecture', 0, '30 hrs', 'Advanced', true, array['#2563eb', '#60a5fa'], null, 'Frontend'),

('Intro to Node.js & REST API', 'JS Server', 0, '14 hrs', 'Beginner', true, array['#16a34a', '#4ade80'], null, 'Backend'),
('SQL Fundamentals & Relational DBs', 'Databases', 0, '18 hrs', 'Beginner', false, array['#0f172a', '#334155'], null, 'Backend'),
('Basics of Routing & HTTP Methods', 'Networking', 0, '10 hrs', 'Beginner', true, array['#db2777', '#f472b6'], null, 'Backend'),
('Java Spring Boot Microservices', 'Enterprise Java', 0, '35 hrs', 'Intermediate', true, array['#6366f1', '#818cf8'], null, 'Backend'),
('PostgreSQL Queries & Optimization', 'Databases', 0, '15 hrs', 'Intermediate', false, array['#0d9488', '#2dd4bf'], null, 'Backend'),
('Redis Caching & Task Queues', 'Performance', 0, '12 hrs', 'Intermediate', true, array['#2563eb', '#60a5fa'], null, 'Backend'),
('Distributed Systems & Scalability', 'System Design', 0, '40 hrs', 'Advanced', true, array['#6366f1', '#818cf8'], null, 'Backend'),
('Docker & Kubernetes Orchestration', 'DevOps', 0, '28 hrs', 'Advanced', false, array['#0ea5e9', '#38bdf8'], null, 'Backend'),
('Go Concurrency & Channels Deep-Dive', 'Backend Go', 0, '24 hrs', 'Advanced', true, array['#0d9488', '#2dd4bf'], null, 'Backend'),

('React Native & Expo Ecosystem', 'Cross-Platform', 0, '18 hrs', 'Beginner', true, array['#6366f1', '#818cf8'], null, 'Mobile'),
('Flexbox Layouts in Mobile Screens', 'UI Design', 0, '8 hrs', 'Beginner', false, array['#ec4899', '#f472b6'], null, 'Mobile'),
('Navigation Containers & Tabs', 'App Flow', 0, '12 hrs', 'Beginner', true, array['#2563eb', '#60a5fa'], null, 'Mobile'),
('Advanced React Navigation v6', 'App Flow', 0, '16 hrs', 'Intermediate', true, array['#6366f1', '#818cf8'], null, 'Mobile'),
('Native Features: Camera, GPS & Audio', 'Hardware APIs', 0, '22 hrs', 'Intermediate', false, array['#0d9488', '#2dd4bf'], null, 'Mobile'),
('State Management in Native Apps', 'Data Flow', 0, '14 hrs', 'Intermediate', true, array['#f59e0b', '#fbbf24'], null, 'Mobile'),
('SwiftUI Mastery for iOS Platforms', 'Native iOS', 0, '30 hrs', 'Advanced', true, array['#f97316', '#fdba74'], null, 'Mobile'),
('Kotlin & Android Jetpack UI', 'Native Android', 0, '32 hrs', 'Advanced', false, array['#0d9488', '#2dd4bf'], null, 'Mobile'),
('Native Bridges & Performance Tuning', 'Advanced Core', 0, '20 hrs', 'Advanced', true, array['#2563eb', '#60a5fa'], null, 'Mobile'),

('Python Fundamentals & Packages', 'Python Dev', 0, '14 hrs', 'Beginner', true, array['#2563eb', '#60a5fa'], null, 'AI'),
('Pandas & Numpy Data Wrangling', 'Data Prep', 0, '16 hrs', 'Beginner', false, array['#0d9488', '#2dd4bf'], null, 'AI'),
('Basic Statistics & Probability', 'Math Foundations', 0, '12 hrs', 'Beginner', true, array['#a855f7', '#c084fc'], null, 'AI'),
('Neural Networks with PyTorch', 'Deep Learning', 0, '28 hrs', 'Intermediate', true, array['#6366f1', '#818cf8'], null, 'AI'),
('Natural Language Processing (NLP)', 'AI Focus', 0, '24 hrs', 'Intermediate', false, array['#db2777', '#f472b6'], null, 'AI'),
('Data Visualization with Recharts', 'Data Presenting', 0, '8 hrs', 'Intermediate', true, array['#0ea5e9', '#38bdf8'], null, 'AI'),
('Fine-Tuning Generative AI Models', 'LLM Systems', 0, '35 hrs', 'Advanced', true, array['#a855f7', '#c084fc'], null, 'AI'),
('MLOps: CI/CD Pipeline for Models', 'AI DevOps', 0, '26 hrs', 'Advanced', false, array['#0d9488', '#2dd4bf'], null, 'AI'),
('Transformer Architectures & Attention', 'Neural Science', 0, '40 hrs', 'Advanced', true, array['#2563eb', '#60a5fa'], null, 'AI')
on conflict do nothing;

-- Resources
insert into public.resources (id, title, subject, level, type, rating, downloads, trending, author, focus_domain) values
('res_1', 'Interactive CSS Flexbox Playground', 'Web Basics', 'Beginner', 'Notes', 4.9, 5200, true, 'EduSync AI Coach', 'Frontend'),
('res_2', 'Next.js Core Web Vitals Optimization Guides', 'Performance', 'Advanced', 'PDF', 4.8, 4800, false, 'EduSync AI Coach', 'Frontend'),
('res_3', 'Tailwind UI Layout Best Practices', 'Styling Systems', 'Intermediate', 'Slides', 4.7, 3400, false, 'EduSync AI Coach', 'Frontend'),
('res_4', 'System Design Interview Cheat Sheet', 'System Design', 'Advanced', 'PDF', 4.9, 9800, true, 'EduSync AI Coach', 'Backend'),
('res_5', 'PostgreSQL Window Functions Explained', 'Databases', 'Intermediate', 'Notes', 4.8, 6200, false, 'EduSync AI Coach', 'Backend'),
('res_6', 'Docker Containerization Fundamentals', 'DevOps', 'Beginner', 'Project', 4.7, 4100, false, 'EduSync AI Coach', 'Backend'),
('res_7', 'React Native Performance Debugging Tools', 'Cross-Platform', 'Intermediate', 'Notes', 4.9, 5800, true, 'EduSync AI Coach', 'Mobile'),
('res_8', 'Expo Router Dynamic Linking Manual', 'App Flow', 'Beginner', 'PDF', 4.8, 4500, false, 'EduSync AI Coach', 'Mobile'),
('res_9', 'iOS Native UI Optimization Principles', 'Native iOS', 'Advanced', 'Slides', 4.7, 3100, false, 'EduSync AI Coach', 'Mobile'),
('res_10', 'Python OOP and Memory Structures', 'Python Dev', 'Beginner', 'Notes', 4.9, 7200, true, 'EduSync AI Coach', 'AI'),
('res_11', 'Calculus behind SGD Backpropagation', 'Math Foundations', 'Intermediate', 'PDF', 4.8, 5100, false, 'EduSync AI Coach', 'AI'),
('res_12', 'Hugging Face LLM Pipeline Integration Guides', 'LLM Systems', 'Advanced', 'Project', 4.7, 3900, false, 'EduSync AI Coach', 'AI')
on conflict do nothing;

-- Milestones
insert into public.milestones (title, description, status, focus_domain) values
('UI/UX Master', 'Design a fully responsive 3-column dashboard grid', 'active', 'Frontend'),
('Component Architect', 'Refactor global state using TypeScript structures', 'locked', 'Frontend'),
('Federation Lead', 'Launch micro-frontends with perfect Web Vitals', 'locked', 'Frontend'),
('REST Designer', 'Build full CRUD REST API endpoints with Express', 'active', 'Backend'),
('Docker Deployer', 'Deploy localized database containers and Redis caching', 'locked', 'Backend'),
('Kubernetes Master', 'Launch enterprise microservice clusters', 'locked', 'Backend'),
('Expo Pioneer', 'Boot an interactive Expo application in the emulator', 'active', 'Mobile'),
('Hardware Orchestrator', 'Access live location maps and camera APIs', 'locked', 'Mobile'),
('Performance Engineer', 'Deploy native Bridges and minimize bundle weight', 'locked', 'Mobile'),
('Data Analyst', 'Filter, clean, and visualize 50k rows using Pandas', 'active', 'AI'),
('PyTorch Builder', 'Train a custom MLP classifier on localized inputs', 'locked', 'AI'),
('MLOps Architect', 'Deploy high-volume LLM API endpoints to public cloud', 'locked', 'AI')
on conflict do nothing;

-- Contacts
insert into public.contacts (id, name, role, initials, online, last, unread, colors, focus_domain) values
('c1', 'Priya M.', 'Mentor · Mobile Expert', 'PM', true, 'Welcome to the Mobile track! 👋', 1, array['#6366f1', '#818cf8'], 'Mobile'),
('c2', 'Rohit K.', 'Peer · Mobile Dev', 'RK', true, 'Let''s study Mobile together! 📚', 0, array['#0ea5e9', '#38bdf8'], 'Mobile'),
('c3', 'Anjali S.', 'Peer · Mobile Intern', 'AS', false, 'Hey! Ready to learn?', 0, array['#0d9488', '#2dd4bf'], 'Mobile'),
('c4', 'Karan T.', 'Career Coach', 'KT', true, 'Happy to guide your career path!', 0, array['#f59e0b', '#fbbf24'], 'Mobile'),
('c5', 'Devika R.', 'Peer · Mobile Enthusiast', 'DR', false, 'Glad to connect!', 0, array['#a855f7', '#c084fc'], 'Mobile')
on conflict do nothing;

-- Career Suggestions
insert into public.career_suggestions (focus_domain, role, match, skills) values
('Frontend', 'UI/UX Front-end Architect', 95, array['React', 'HTML5/CSS3', 'Design Systems']),
('Frontend', 'Web Application Lead', 88, array['TypeScript', 'Next.js', 'Redux']),
('Frontend', 'Product Developer', 82, array['Core JS', 'Tailwind', 'Responsive Design']),
('Backend', 'Senior Backend Engineer', 94, array['Node.js', 'Express', 'SQL & APIs']),
('Backend', 'System & DB Architect', 88, array['Prisma', 'PostgreSQL', 'Caching']),
('Backend', 'Cloud Operations Specialist', 81, array['Docker', 'Deploy', 'System Design']),
('Mobile', 'iOS & Android App Dev', 94, array['React Native', 'Expo Ecosystem', 'Flexbox']),
('Mobile', 'Cross-Platform Architect', 87, array['Hardware APIs', 'Kotlin/Swift', 'Navigation']),
('Mobile', 'Mobile Interface Designer', 80, array['App Store Deploy', 'UI Frameworks', 'Bridges']),
('AI', 'Machine Learning Engineer', 96, array['Python Dev', 'Math Models', 'PyTorch']),
('AI', 'Data Science Researcher', 88, array['Pandas/Numpy', 'Stats & Math', 'Data Prep']),
('AI', 'NLP & LLM Specialist', 81, array['Attention Models', 'Transformers', 'Data Wrangling'])
on conflict do nothing;

-- Weak Areas
insert into public.weak_areas (focus_domain, topic, score) values
('Frontend', 'CSS Grid & Flexbox', 58),
('Frontend', 'State Context Hydration', 62),
('Frontend', 'TypeScript Strict Mappings', 68),
('Backend', 'SQL Index & Join Queries', 54),
('Backend', 'Asynchronous Event Loops', 61),
('Backend', 'Prisma Schema Relations', 67),
('Mobile', 'Native Bridge Compilation', 56),
('Mobile', 'Flexbox Layout Scaling', 62),
('Mobile', 'Expo Router Deep-Linking', 69),
('AI', 'SGD Backpropagation Math', 52),
('AI', 'Pandas Data Cleaning', 63),
('AI', 'CNN Convolution Matrix', 68)
on conflict do nothing;

-- ==========================================
-- 13. PEER CONNECTIONS Table
-- ==========================================
create table if not exists public.peer_connections (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users on delete cascade not null,
  receiver_id uuid references auth.users on delete cascade not null,
  status text not null default 'pending', -- 'pending', 'accepted', 'rejected'
  created_at timestamp with time zone default now(),
  unique(sender_id, receiver_id)
);

-- ==========================================
-- 14. PEER CONVERSATIONS Table
-- ==========================================
create table if not exists public.peer_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now()
);

-- ==========================================
-- 15. PEER CONVERSATION PARTICIPANTS Table
-- ==========================================
create table if not exists public.peer_conversation_participants (
  conversation_id uuid references public.peer_conversations(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  primary key (conversation_id, user_id)
);

-- ==========================================
-- 16. PEER MESSAGES Table
-- ==========================================
create table if not exists public.peer_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.peer_conversations(id) on delete cascade not null,
  sender_id uuid references auth.users on delete cascade not null,
  message text not null,
  created_at timestamp with time zone default now(),
  is_read boolean default false
);

-- ==========================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================
alter table public.peer_connections enable row level security;
alter table public.peer_conversations enable row level security;
alter table public.peer_conversation_participants enable row level security;
alter table public.peer_messages enable row level security;

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Peer Connections Policies
drop policy if exists "Users can view connections they are involved in" on public.peer_connections;
create policy "Users can view connections they are involved in" on public.peer_connections
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users can insert connection requests" on public.peer_connections;
create policy "Users can insert connection requests" on public.peer_connections
  for insert with check (auth.uid() = sender_id);

drop policy if exists "Users can update connection requests they received" on public.peer_connections;
create policy "Users can update connection requests they received" on public.peer_connections
  for update using (auth.uid() = receiver_id);

-- Peer Conversations Policies
drop policy if exists "Users can view conversations they participate in" on public.peer_conversations;
create policy "Users can view conversations they participate in" on public.peer_conversations
  for select using (
    exists (
      select 1 from public.peer_conversation_participants
      where peer_conversation_participants.conversation_id = id
      and peer_conversation_participants.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert conversations" on public.peer_conversations;
create policy "Users can insert conversations" on public.peer_conversations
  for insert with check (true);

-- Peer Conversation Participants Policies
drop policy if exists "Users can view participants in their conversations" on public.peer_conversation_participants;
create policy "Users can view participants in their conversations" on public.peer_conversation_participants
  for select using (
    exists (
      select 1 from public.peer_conversation_participants cp
      where cp.conversation_id = conversation_id
      and cp.user_id = auth.uid()
    )
  );

drop policy if exists "Allow inserting participants" on public.peer_conversation_participants;
create policy "Allow inserting participants" on public.peer_conversation_participants
  for insert with check (true);

-- Peer Messages Policies
drop policy if exists "Users can view messages in their conversations" on public.peer_messages;
create policy "Users can view messages in their conversations" on public.peer_messages
  for select using (
    exists (
      select 1 from public.peer_conversation_participants
      where peer_conversation_participants.conversation_id = conversation_id
      and peer_conversation_participants.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert messages into their conversations" on public.peer_messages;
create policy "Users can insert messages into their conversations" on public.peer_messages
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.peer_conversation_participants
      where peer_conversation_participants.conversation_id = conversation_id
      and peer_conversation_participants.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update message read status" on public.peer_messages;
create policy "Users can update message read status" on public.peer_messages
  for update using (
    exists (
      select 1 from public.peer_conversation_participants
      where peer_conversation_participants.conversation_id = conversation_id
      and peer_conversation_participants.user_id = auth.uid()
    )
  );

-- ==========================================
-- ENABLE REALTIME REPLICATION FOR PEER CHATS
-- ==========================================
begin;
  -- Add peer chat tables to the supabase_realtime publication
  alter publication supabase_realtime add table public.peer_connections;
  alter publication supabase_realtime add table public.peer_conversations;
  alter publication supabase_realtime add table public.peer_conversation_participants;
  alter publication supabase_realtime add table public.peer_messages;
commit;

