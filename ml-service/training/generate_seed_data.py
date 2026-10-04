import json
import os
import random
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "datasets"
DATASET_DIR.mkdir(parents=True, exist_ok=True)

# 1. Courses Catalog with Embedded Streaming Video URLs
COURSES = [
    # Frontend
    {
        "id": "fe-001",
        "title": "HTML5 & Modern CSS3 Fundamentals",
        "domain": "Frontend",
        "difficulty": "Beginner",
        "time_weeks": 3,
        "skills": ["HTML", "CSS", "Responsive Design", "Flexbox", "CSS Grid"],
        "description": "Master foundational web markup, layout systems, and responsive web design principles.",
        "difficulty_level": 1,
        "video_url": "https://www.youtube.com/embed/0xMQfnTU6oo"
    },
    {
        "id": "fe-002",
        "title": "JavaScript ES6+ Deep Dive",
        "domain": "Frontend",
        "difficulty": "Beginner",
        "time_weeks": 5,
        "skills": ["JavaScript", "ES6", "Async/Await", "DOM Manipulation", "Closures"],
        "description": "Core JavaScript programming, modern syntax, asynchronous patterns, and browser APIs.",
        "difficulty_level": 2,
        "video_url": "https://www.youtube.com/embed/hdI2bqOjy3c"
    },
    {
        "id": "fe-003",
        "title": "React.js & Modern State Architecture",
        "domain": "Frontend",
        "difficulty": "Intermediate",
        "time_weeks": 6,
        "skills": ["React", "Hooks", "Component Design", "Context API", "SPA"],
        "description": "Build interactive single-page applications with React functional components and custom hooks.",
        "difficulty_level": 3,
        "video_url": "https://www.youtube.com/embed/Ke90Tje7VS0"
    },
    {
        "id": "fe-004",
        "title": "TypeScript Mastery for Frontend Engineers",
        "domain": "Frontend",
        "difficulty": "Intermediate",
        "time_weeks": 4,
        "skills": ["TypeScript", "Type Safety", "Generics", "React with TS"],
        "description": "Learn strict typing, interface contracts, generics, and robust React frontend development.",
        "difficulty_level": 3,
        "video_url": "https://www.youtube.com/embed/d56mG7DezGs"
    },
    {
        "id": "fe-005",
        "title": "Next.js 14, SSR & Full-Stack React",
        "domain": "Frontend",
        "difficulty": "Advanced",
        "time_weeks": 6,
        "skills": ["Next.js", "Server Components", "SSR", "App Router", "Performance Optimization"],
        "description": "Enterprise full-stack React architecture with Server Components, streaming, and SEO.",
        "difficulty_level": 4,
        "video_url": "https://www.youtube.com/embed/wm5gMKuwSYk"
    },
    {
        "id": "fe-006",
        "title": "Web Performance, Core Web Vitals & Microfrontends",
        "domain": "Frontend",
        "difficulty": "Advanced",
        "time_weeks": 5,
        "skills": ["Web Vitals", "Lighthouse", "Code Splitting", "Microfrontends", "WASM"],
        "description": "Sub-second load times, asset pipeline optimization, rendering pipelines, and modular scaling.",
        "difficulty_level": 5,
        "video_url": "https://www.youtube.com/embed/t5fjIW3tB00"
    },

    # Backend
    {
        "id": "be-001",
        "title": "Node.js & Express.js REST API Architecture",
        "domain": "Backend",
        "difficulty": "Beginner",
        "time_weeks": 4,
        "skills": ["Node.js", "Express", "RESTful API", "Middleware", "JSON"],
        "description": "Build production-grade REST APIs with routing, error handling, and modular controllers.",
        "difficulty_level": 2,
        "video_url": "https://www.youtube.com/embed/Oe421EPjeBE"
    },
    {
        "id": "be-002",
        "title": "Relational Databases & PostgreSQL Mastery",
        "domain": "Backend",
        "difficulty": "Beginner",
        "time_weeks": 4,
        "skills": ["PostgreSQL", "SQL", "Database Design", "Indexing", "ACID"],
        "description": "Data modeling, relational constraints, complex joins, indexing strategies, and migrations.",
        "difficulty_level": 2,
        "video_url": "https://www.youtube.com/embed/7S_tz1z_5bA"
    },
    {
        "id": "be-003",
        "title": "Authentication, JWT & Web Security Best Practices",
        "domain": "Backend",
        "difficulty": "Intermediate",
        "time_weeks": 3,
        "skills": ["Authentication", "JWT", "OAuth2", "CORS", "Cybersecurity", "Bcrypt"],
        "description": "Secure API endpoints with token authentication, role-based access control (RBAC), and sanitization.",
        "difficulty_level": 3,
        "video_url": "https://www.youtube.com/embed/mbsmsi7l3r4"
    },
    {
        "id": "be-004",
        "title": "Scalable Microservices with Docker & gRPC",
        "domain": "Backend",
        "difficulty": "Intermediate",
        "time_weeks": 5,
        "skills": ["Microservices", "Docker", "gRPC", "Protobuf", "API Gateway"],
        "description": "Containerize distributed backend services, inter-service communication, and orchestration.",
        "difficulty_level": 4,
        "video_url": "https://www.youtube.com/embed/35EQXmHKZYs"
    },
    {
        "id": "be-005",
        "title": "Distributed Systems, Redis Caching & Message Queues",
        "domain": "Backend",
        "difficulty": "Advanced",
        "time_weeks": 6,
        "skills": ["Redis", "RabbitMQ", "Kafka", "Event-Driven", "Caching Strategies"],
        "description": "High-throughput event streaming, distributed caching, pub/sub queues, and idempotency.",
        "difficulty_level": 5,
        "video_url": "https://www.youtube.com/embed/jgpVdJB2sKQ"
    },

    # Mobile
    {
        "id": "mob-001",
        "title": "React Native & Expo Cross-Platform Essentials",
        "domain": "Mobile",
        "difficulty": "Beginner",
        "time_weeks": 4,
        "skills": ["React Native", "Expo", "Mobile UI", "Flexbox", "Cross-Platform"],
        "description": "Build and test native iOS and Android apps with a single modern JavaScript/TypeScript codebase.",
        "difficulty_level": 2,
        "video_url": "https://www.youtube.com/embed/0-S5a0eXPoc"
    },
    {
        "id": "mob-002",
        "title": "Native Navigation, Gestures & Animations",
        "domain": "Mobile",
        "difficulty": "Intermediate",
        "time_weeks": 4,
        "skills": ["React Navigation", "Reanimated", "Gesture Handler", "Mobile UX"],
        "description": "Fluid 60 FPS transitions, drawer/tab hierarchies, interactive gestures, and haptic feedback.",
        "difficulty_level": 3,
        "video_url": "https://www.youtube.com/embed/UVUPEokN8Mw"
    },
    {
        "id": "mob-003",
        "title": "Offline-First Mobile Architecture & SQLite Sync",
        "domain": "Mobile",
        "difficulty": "Advanced",
        "time_weeks": 5,
        "skills": ["Offline-First", "WatermelonDB", "SQLite", "Background Sync", "Push Notifications"],
        "description": "Local persistence, optimistic UI updates, conflict resolution, and background workers.",
        "difficulty_level": 4,
        "video_url": "https://www.youtube.com/embed/kGtEax1WQFg"
    },

    # AI / Data Science
    {
        "id": "ai-001",
        "title": "Python for Data Science & Machine Learning",
        "domain": "AI/ML",
        "difficulty": "Beginner",
        "time_weeks": 4,
        "skills": ["Python", "NumPy", "Pandas", "Data Cleaning", "Matplotlib"],
        "description": "Data manipulation, exploratory data analysis (EDA), and numerical computing foundations.",
        "difficulty_level": 2,
        "video_url": "https://www.youtube.com/embed/rfscVS0vtbw"
    },
    {
        "id": "ai-002",
        "title": "Supervised & Unsupervised Machine Learning with Scikit-Learn",
        "domain": "AI/ML",
        "difficulty": "Intermediate",
        "time_weeks": 5,
        "skills": ["Machine Learning", "Scikit-Learn", "Regression", "Classification", "Clustering"],
        "description": "Train, evaluate, and tune predictive models like Random Forest, XGBoost, and K-Means.",
        "difficulty_level": 3,
        "video_url": "https://www.youtube.com/embed/7eh4d6sabA0"
    },
    {
        "id": "ai-003",
        "title": "Deep Learning with PyTorch & Neural Networks",
        "domain": "AI/ML",
        "difficulty": "Intermediate",
        "time_weeks": 6,
        "skills": ["PyTorch", "Deep Learning", "CNN", "RNN", "Backpropagation"],
        "description": "Build custom neural network architectures for computer vision and sequence processing.",
        "difficulty_level": 4,
        "video_url": "https://www.youtube.com/embed/V_xro1bcAuA"
    },
    {
        "id": "ai-004",
        "title": "Generative AI, Large Language Models & LangChain",
        "domain": "AI/ML",
        "difficulty": "Advanced",
        "time_weeks": 5,
        "skills": ["LLMs", "RAG", "Embeddings", "LangChain", "Prompt Engineering", "Fine-Tuning"],
        "description": "Implement enterprise RAG pipelines, vector databases (pgvector), and fine-tuned AI assistants.",
        "difficulty_level": 5,
        "video_url": "https://www.youtube.com/embed/ySEx_Bqxvvo"
    },
    {
        "id": "ai-005",
        "title": "MLOps & Production Model Deployment",
        "domain": "AI/ML",
        "difficulty": "Advanced",
        "time_weeks": 4,
        "skills": ["MLOps", "FastAPI", "Docker", "Model Monitoring", "MLflow", "CI/CD"],
        "description": "Package, serve low-latency REST ML inference APIs, monitor data drift, and automate pipelines.",
        "difficulty_level": 5,
        "video_url": "https://www.youtube.com/embed/4aTRp62_x6Q"
    }
]

# 2. Career & Job Profiles
JOBS = [
    {
        "id": "job-001",
        "title": "Junior Frontend Developer",
        "domain": "Frontend",
        "experience_level": "Entry",
        "salary_range": "$65,000 - $85,000",
        "required_skills": ["HTML", "CSS", "JavaScript", "React", "Responsive Design"],
        "description": "Develop user interfaces and translate UI wireframes into responsive web components."
    },
    {
        "id": "job-002",
        "title": "Senior React / Full-Stack Engineer",
        "domain": "Frontend",
        "experience_level": "Senior",
        "salary_range": "$125,000 - $165,000",
        "required_skills": ["React", "TypeScript", "Next.js", "Server Components", "Performance Optimization", "Node.js"],
        "description": "Architect scalable frontend platforms, design systems, and high-performance web applications."
    },
    {
        "id": "job-003",
        "title": "Backend Systems Engineer",
        "domain": "Backend",
        "experience_level": "Mid",
        "salary_range": "$95,000 - $130,000",
        "required_skills": ["Node.js", "Express", "PostgreSQL", "Authentication", "RESTful API", "Docker"],
        "description": "Design resilient microservices, secure APIs, database schemas, and background job queues."
    },
    {
        "id": "job-004",
        "title": "Distributed Systems / Backend Architect",
        "domain": "Backend",
        "experience_level": "Lead",
        "salary_range": "$150,000 - $200,000",
        "required_skills": ["Microservices", "Redis", "Kafka", "PostgreSQL", "Distributed Systems", "gRPC"],
        "description": "Lead the architectural vision for fault-tolerant, high-throughput distributed backend services."
    },
    {
        "id": "job-005",
        "title": "Cross-Platform Mobile Engineer",
        "domain": "Mobile",
        "experience_level": "Mid",
        "salary_range": "$90,000 - $125,000",
        "required_skills": ["React Native", "Expo", "TypeScript", "React Navigation", "Mobile UX", "Offline-First"],
        "description": "Build high-performance mobile applications published to both the Apple App Store and Google Play Store."
    },
    {
        "id": "job-006",
        "title": "Applied AI / Machine Learning Engineer",
        "domain": "AI/ML",
        "experience_level": "Mid",
        "salary_range": "$115,000 - $155,000",
        "required_skills": ["Python", "PyTorch", "Scikit-Learn", "FastAPI", "MLOps", "Docker", "Machine Learning"],
        "description": "Develop and deploy scalable machine learning models and predictive microservices to production."
    },
    {
        "id": "job-007",
        "title": "Generative AI & LLM Solutions Architect",
        "domain": "AI/ML",
        "experience_level": "Senior",
        "salary_range": "$145,000 - $190,000",
        "required_skills": ["LLMs", "RAG", "Embeddings", "LangChain", "PyTorch", "FastAPI", "Fine-Tuning"],
        "description": "Design state-of-the-art Generative AI pipelines, retrieval-augmented systems, and intelligent agents."
    }
]

# 3. Adaptive Assessment Question Bank with IRT Parameters
ASSESSMENT_QUESTIONS = [
    {
        "id": "q-fe-01",
        "domain": "Frontend",
        "skill": "HTML/CSS",
        "question": "Which CSS property is used to align flex items along the cross axis?",
        "options": ["justify-content", "align-items", "flex-direction", "grid-template-columns"],
        "correct_index": 1,
        "difficulty_b": -1.5,
        "discrimination_a": 1.2,
        "explanation": "'align-items' controls alignment on the cross-axis, while 'justify-content' controls the main axis."
    },
    {
        "id": "q-fe-02",
        "domain": "Frontend",
        "skill": "JavaScript",
        "question": "What is the output of `typeof null` in standard JavaScript?",
        "options": ["'null'", "'undefined'", "'object'", "'boolean'"],
        "correct_index": 2,
        "difficulty_b": -0.8,
        "discrimination_a": 1.0,
        "explanation": "Due to a legacy quirk in JS engine design, `typeof null` returns 'object'."
    },
    {
        "id": "q-fe-03",
        "domain": "Frontend",
        "skill": "React",
        "question": "Why should you never call React Hooks inside loops, conditions, or nested functions?",
        "options": [
            "It breaks JavaScript garbage collection",
            "React relies on the order in which Hooks are called between renders",
            "It reduces CSS render performance",
            "TypeScript compiler throws a syntax error"
        ],
        "correct_index": 1,
        "difficulty_b": 0.2,
        "discrimination_a": 1.6,
        "explanation": "React preserves Hook state correctly by relying on a stable invocation order on every render."
    },
    {
        "id": "q-fe-04",
        "domain": "Frontend",
        "skill": "TypeScript",
        "question": "What is the difference between `unknown` and `any` in TypeScript?",
        "options": [
            "`unknown` is type-safe because you cannot perform operations on it without narrowing the type first",
            "`unknown` only accepts primitives, whereas `any` accepts objects",
            "`unknown` is deprecated in modern TypeScript",
            "There is no difference"
        ],
        "correct_index": 0,
        "difficulty_b": 0.9,
        "discrimination_a": 1.8,
        "explanation": "`unknown` forces type checking and narrowing before property access, unlike `any` which disables all checks."
    },
    {
        "id": "q-fe-05",
        "domain": "Frontend",
        "skill": "Next.js",
        "question": "In React Server Components (RSC), how do Server Components differ from Client Components?",
        "options": [
            "Server Components cannot fetch data",
            "Server Components execute only on the server and send zero JavaScript to the client bundle",
            "Server Components can use `useState` and `useEffect`",
            "Server Components cannot render Client Components as children"
        ],
        "correct_index": 1,
        "difficulty_b": 1.8,
        "discrimination_a": 2.1,
        "explanation": "Server Components reduce client bundle size by running strictly on the server without shipping runtime JS."
    },

    # Backend Questions
    {
        "id": "q-be-01",
        "domain": "Backend",
        "skill": "REST API",
        "question": "Which HTTP status code should be returned when a new resource is successfully created?",
        "options": ["200 OK", "201 Created", "204 No Content", "301 Moved Permanently"],
        "correct_index": 1,
        "difficulty_b": -1.4,
        "discrimination_a": 1.1,
        "explanation": "201 Created indicates the request succeeded and a new resource was created."
    },
    {
        "id": "q-be-02",
        "domain": "Backend",
        "skill": "SQL",
        "question": "What is the primary benefit of adding a B-Tree database index to a frequently queried column?",
        "options": [
            "Guarantees data encryption at rest",
            "Reduces query time from O(N) table scans to O(log N) tree lookups",
            "Automatically normalizes the database table",
            "Prevents SQL injection attacks"
        ],
        "correct_index": 1,
        "difficulty_b": 0.0,
        "discrimination_a": 1.5,
        "explanation": "B-Tree indexes allow the query planner to quickly locate matching rows with logarithmic complexity."
    },
    {
        "id": "q-be-03",
        "domain": "Backend",
        "skill": "Authentication",
        "question": "Where is the most secure place to store a JWT refresh token in a browser web client?",
        "options": [
            "`localStorage`",
            "`sessionStorage`",
            "`HttpOnly, Secure, SameSite` Cookie",
            "Global JavaScript variable"
        ],
        "correct_index": 2,
        "difficulty_b": 0.7,
        "discrimination_a": 1.7,
        "explanation": "HttpOnly cookies cannot be accessed via JavaScript `document.cookie`, mitigating XSS credential theft."
    },
    {
        "id": "q-be-04",
        "domain": "Backend",
        "skill": "Distributed Systems",
        "question": "In the CAP theorem, what does Partition Tolerance (P) guarantee?",
        "options": [
            "Zero network latency across geographic regions",
            "The system continues to operate despite arbitrary packet loss or network failure between nodes",
            "Database partitions are encrypted with AES-256",
            "Transactions never produce deadlocks"
        ],
        "correct_index": 1,
        "difficulty_b": 1.6,
        "discrimination_a": 2.0,
        "explanation": "Partition tolerance means the cluster survives communication dropouts between network segments."
    },

    # AI / ML Questions
    {
        "id": "q-ai-01",
        "domain": "AI/ML",
        "skill": "Python/Data",
        "question": "In Pandas, which method returns the first N rows of a DataFrame?",
        "options": ["df.top()", "df.head()", "df.sample()", "df.first()"],
        "correct_index": 1,
        "difficulty_b": -1.8,
        "discrimination_a": 1.0,
        "explanation": "`df.head()` displays the top rows (default 5) of a Pandas DataFrame."
    },
    {
        "id": "q-ai-02",
        "domain": "AI/ML",
        "skill": "Machine Learning",
        "question": "What is the key indicator of model overfitting during training?",
        "options": [
            "Both training error and validation error remain very high",
            "Training loss decreases significantly while validation loss begins to increase",
            "Model training finishes faster than expected",
            "Feature weights all converge to zero"
        ],
        "correct_index": 1,
        "difficulty_b": 0.1,
        "discrimination_a": 1.5,
        "explanation": "Overfitting happens when a model memorizes training patterns and fails to generalize to validation data."
    },
    {
        "id": "q-ai-03",
        "domain": "AI/ML",
        "skill": "Deep Learning",
        "question": "Why is the vanishing gradient problem common with standard Sigmoid activation in deep networks?",
        "options": [
            "Sigmoid derivative has a maximum value of 0.25, exponentially shrinking gradients across layers",
            "Sigmoid produces negative numbers during forward pass",
            "Sigmoid requires GPU matrix multiplication",
            "Sigmoid cannot be differentiated"
        ],
        "correct_index": 0,
        "difficulty_b": 1.2,
        "discrimination_a": 1.9,
        "explanation": "Because Sigmoid's derivative is <= 0.25, multiplying gradients backwards across many layers decays them to 0."
    },
    {
        "id": "q-ai-04",
        "domain": "AI/ML",
        "skill": "Generative AI",
        "question": "In Retrieval-Augmented Generation (RAG), what is the primary role of Vector Embeddings?",
        "options": [
            "To replace the LLM transformer architecture",
            "To convert text chunks into semantic vector spaces for fast nearest-neighbor similarity search",
            "To compress the size of the SQLite database",
            "To calculate gradient descent loss"
        ],
        "correct_index": 1,
        "difficulty_b": 1.7,
        "discrimination_a": 2.2,
        "explanation": "Vector embeddings represent semantic meaning numerically, allowing cosine retrieval of relevant context."
    }
]

# 4. Generate Synthetic User Profiles & Interaction History
def generate_synthetic_telemetry(num_users=250):
    users = []
    interactions = []
    
    domains = ["Frontend", "Backend", "Mobile", "AI/ML"]
    experience_levels = ["Beginner", "Intermediate", "Advanced"]
    learning_goals = ["Career Switch", "Skill Upgrade", "Exam Prep", "Portfolio Building"]
    paces = ["Casual (2-4 hrs/wk)", "Standard (5-10 hrs/wk)", "Intensive (15+ hrs/wk)"]

    for i in range(1, num_users + 1):
        user_id = f"usr_{i:04d}"
        primary_domain = random.choice(domains)
        level = random.choice(experience_levels)
        goal = random.choice(learning_goals)
        pace = random.choice(paces)

        theta_base = -1.0 if level == "Beginner" else (0.2 if level == "Intermediate" else 1.4)
        user_theta = float(random.gauss(theta_base, 0.5))

        user_profile = {
            "user_id": user_id,
            "primary_domain": primary_domain,
            "level": level,
            "goal": goal,
            "pace": pace,
            "true_ability_theta": round(user_theta, 3),
            "mastered_skills": []
        }

        domain_courses = [c for c in COURSES if c["domain"] == primary_domain]
        other_courses = [c for c in COURSES if c["domain"] != primary_domain]

        chosen_courses = random.sample(domain_courses, k=min(len(domain_courses), random.randint(2, len(domain_courses))))
        if random.random() < 0.4 and other_courses:
            chosen_courses.append(random.choice(other_courses))

        for course in chosen_courses:
            difficulty_num = course["difficulty_level"]
            prob_success = 1.0 / (1.0 + pow(2.71828, -(user_theta * 1.5 - (difficulty_num - 2.5))))
            
            completed = random.random() < prob_success
            progress = random.randint(70, 100) if completed else random.randint(10, 65)
            rating = random.randint(4, 5) if completed else random.randint(2, 4)

            if completed:
                user_profile["mastered_skills"].extend(course["skills"][:3])

            interactions.append({
                "user_id": user_id,
                "course_id": course["id"],
                "domain": course["domain"],
                "progress": progress,
                "rating": rating,
                "completed": completed,
                "time_spent_mins": progress * random.randint(5, 12)
            })

        user_profile["mastered_skills"] = list(set(user_profile["mastered_skills"]))
        users.append(user_profile)

    return users, interactions

def main():
    print("Generating seed training data for EduSync ML models...")
    
    with open(DATASET_DIR / "courses.json", "w", encoding="utf-8") as f:
        json.dump(COURSES, f, indent=2)
        print(f"Saved {len(COURSES)} courses with video URLs to datasets/courses.json")

    with open(DATASET_DIR / "jobs.json", "w", encoding="utf-8") as f:
        json.dump(JOBS, f, indent=2)
        print(f"Saved {len(JOBS)} career profiles to datasets/jobs.json")

    with open(DATASET_DIR / "assessment_questions.json", "w", encoding="utf-8") as f:
        json.dump(ASSESSMENT_QUESTIONS, f, indent=2)
        print(f"Saved {len(ASSESSMENT_QUESTIONS)} calibrated questions to datasets/assessment_questions.json")

    users, interactions = generate_synthetic_telemetry(num_users=300)
    
    with open(DATASET_DIR / "users.json", "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2)
        print(f"Saved {len(users)} user profiles to datasets/users.json")

    with open(DATASET_DIR / "user_interactions.json", "w", encoding="utf-8") as f:
        json.dump(interactions, f, indent=2)
        print(f"Saved {len(interactions)} interaction telemetry logs to datasets/user_interactions.json")

    print("\nDataset generation completed successfully!")

if __name__ == "__main__":
    main()
