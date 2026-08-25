// AI Coach Response Engine for EduSync

const RESOURCE_SUGGESTIONS: Record<string, string[]> = {
  Frontend: [
    "HTML5, CSS3, & Modern Grid (Course)",
    "JavaScript Fundamentals & DOM (Course)",
    "Intro to React & Component States (Course)",
    "Interactive CSS Flexbox Playground (Notes)",
    "Next.js Core Web Vitals Optimization Guides (Technical Article)",
    "Tailwind UI Layout Best Practices (Video)",
  ],
  Backend: [
    "Intro to Node.js & REST API (Course)",
    "SQL Fundamentals & Relational DBs (Course)",
    "Basics of Routing & HTTP Methods (Course)",
    "System Design Interview Cheat Sheet (Cheat Sheet)",
    "PostgreSQL Window Functions Explained (Technical Article)",
    "Docker Containerization Fundamentals (Lab)",
  ],
  Mobile: [
    "React Native & Expo Ecosystem (Course)",
    "Flexbox Layouts in Mobile Screens (Course)",
    "Navigation Containers & Tabs (Course)",
    "React Native Performance Debugging Tools (Interactive Guide)",
    "Expo Router Dynamic Linking Manual (Documentation)",
    "iOS Native UI Optimization Principles (Video)",
  ],
  AI: [
    "Python Fundamentals & Packages (Course)",
    "Pandas & Numpy Data Wrangling (Course)",
    "Neural Networks with PyTorch (Course)",
    "Python OOP and Memory Structures (Interactive Tutorial)",
    "Calculus behind SGD Backpropagation (Video Lecture)",
    "Hugging Face LLM Pipeline Integration Guides (Lab)",
  ],
};

export function generateAICoachResponse(
  message: string,
  history: Array<{ from: "me" | "them"; text: string }>,
  contactRole: string,
  focusDomain: string,
): string {
  const msg = message.toLowerCase().trim();

  // 1. CONVERSATIONAL MEMORY FOR QUIZ GRADING
  const lastCoachMsg =
    history
      .slice()
      .reverse()
      .find((h) => h.from === "them")?.text || "";
  const isAnsweringQuiz = lastCoachMsg.includes("QUIZ:") || lastCoachMsg.includes("Question 1:");

  if (
    isAnsweringQuiz &&
    (msg.includes("a") ||
      msg.includes("b") ||
      msg.includes("c") ||
      msg.includes("d") ||
      msg.match(/\b[1-3]\b/))
  ) {
    return `### 📝 Quiz Evaluation & Feedback

Thanks for submitting your answers! Let's grade them:

1. **Question 1**: **Correct!** Great understanding of the core scoping/lifecycle.
2. **Question 2**: **Correct!** Your logic aligns with industry design patterns.
3. **Question 3**: **Partial.** You chose the correct track, but missed the edge configuration.

**Final Score: 2.5 / 3.0** (Earned +30 XP! 🌟)

Would you like me to explain the theory behind any of these questions, or generate another quiz for you?`;
  }

  // 2. QUIZ GENERATION
  if (
    msg.includes("quiz") ||
    msg.includes("test") ||
    msg.includes("mcq") ||
    msg.includes("question")
  ) {
    const topic =
      msg.replace(/generate|give|me|a|quiz|test|mcq|on|about/g, "").trim() || focusDomain;
    return `### 🧠 AI Generated Quiz: ${topic.toUpperCase()}

Here is a quick 3-question MCQ quiz to test your knowledge. Reply with your answers (e.g. "1: A, 2: B, 3: C") to get them graded instantly!

**Question 1:** What is the primary purpose of state context hydration in ${focusDomain} development?
- **A)** To compress files during client-side build bundle creation.
- **B)** To hydrate initial server-side values into client-side interactive state.
- **C)** To directly map relational database tables into native classes.
- **D)** To encrypt connection routes.

**Question 2:** Which of the following represents a major performance bottleneck for a high-traffic ${focusDomain} app?
- **A)** Storing small static constants in code.
- **B)** Excessive re-renders or unindexed queries loading full tables.
- **C)** Using semantic container layouts.
- **D)** Running code inside strict modes.

**Question 3:** How does an application ensure offline synchronization when connectivity is weak?
- **A)** By clearing all caches immediately on offline states.
- **B)** By queueing mutation tasks locally and flushing them once connected.
- **C)** By forcing the page to redirect to an error screen.
- **D)** By running direct live database connections continuously.

*Reply with your answers to verify your progress!*`;
  }

  // 3. STUDY PLAN CREATION
  if (
    msg.includes("study plan") ||
    msg.includes("schedule") ||
    msg.includes("plan") ||
    msg.includes("roadmap")
  ) {
    return `### 📅 Personalized 4-Week Study Plan: ${focusDomain}

Based on your current learning progress and goals, here is your customized timeline:

*   **Week 1: Foundations & Setup**
    *   **Goal:** Master the syntax, configurations, and basic routing mechanics.
    *   **Recommended Resource:** Revisit the *${RESOURCE_SUGGESTIONS[focusDomain]?.[0]}* course.
    *   **Task:** Build a basic boilerplate and run it locally.
*   **Week 2: Advanced Data & Architecture**
    *   **Goal:** Deep dive into global state context, queries, and APIs.
    *   **Recommended Resource:** Study *${RESOURCE_SUGGESTIONS[focusDomain]?.[3]}*.
    *   **Task:** Fetch dynamic values from mock APIs and render lists.
*   **Week 3: Quality, Performance & Security**
    *   **Goal:** Implement validation schemas, unit tests, and security principles.
    *   **Recommended Resource:** Review *${RESOURCE_SUGGESTIONS[focusDomain]?.[4]}*.
    *   **Task:** Run performance diagnostics and resolve bottleneck items.
*   **Week 4: Deployment & Review**
    *   **Goal:** Deploy your production build and clear remaining assessments.
    *   **Recommended Resource:** Prepare using the *${RESOURCE_SUGGESTIONS[focusDomain]?.[5]}*.
    *   **Task:** Link your GitHub repo to Vercel/Render for live host.

Would you like me to adjust the difficulty level, or focus on a specific weak area first?`;
  }

  // 4. CAREER PATH RECOMMENDATIONS
  if (
    msg.includes("career") ||
    msg.includes("job") ||
    msg.includes("role") ||
    msg.includes("hire") ||
    msg.includes("salary")
  ) {
    return `### 💼 AI Career Path Recommendations

Based on your current focus in **${focusDomain}** and your proficiency level, here are your top fits:

1.  **Lead ${focusDomain} Architect** (Match Rating: **96%**)
    *   **Role:** Design core scalable modules, establish clean code structures, and manage CI/CD pipelines.
    *   **Essential Skills:** Focus domain APIs, Performance Tuning, Security protocols.
    *   **Est. Salary Range:** $115k - $160k
2.  **Product Release Engineer** (Match Rating: **87%**)
    *   **Role:** Bridge design guidelines and backend services, ensuring seamless UX flows and hardware integrations.
    *   **Essential Skills:** Component lifecycles, global state, responsive layouts.
    *   **Est. Salary Range:** $95k - $130k

**Next steps for your career:**
I suggest completing the *Visual ${focusDomain} Layout Challenge* assessment on your dashboard. Having this project in your portfolio will show recruiters your hands-on proficiency!`;
  }

  // 5. INTERVIEW QUESTIONS
  if (
    msg.includes("interview") ||
    msg.includes("questions") ||
    msg.includes("mock") ||
    msg.includes("prepare")
  ) {
    return `### 🎤 Mock Interview Preparation: ${focusDomain}

Here are 3 common interview questions along with ideal answers to study:

1.  **Question:** How do you optimize rendering performance in a high-density ${focusDomain} interface?
    *   *Ideal Answer:* By avoiding inline calculations inside render methods, implementing memoization (such as \`useMemo\` or lazy loading), virtualizing scroll lists, and keeping state localized to prevent parent-level re-render cascades.
2.  **Question:** Explain the difference between client-side state hydration and database syncing.
    *   *Ideal Answer:* Client-side state hydration initializes in-memory templates with cached values on client load, whereas database syncing performs real-time queries (using protocols like WebSockets or REST) to update persistent server tables.
3.  **Question:** How do you handle security vulnerabilities like CSRF or SQL injection in your focus domain?
    *   *Ideal Answer:* By validating all client inputs using schema validators (like Zod), utilizing parameterized ORM queries, and enforcing secure HTTP-only cookie tokens.

Would you like me to quiz you on one of these topics, or explain a concept in detail?`;
  }

  // 6. EXAM REVISION PLANS
  if (
    msg.includes("revision") ||
    msg.includes("exam") ||
    msg.includes("test") ||
    msg.includes("cram") ||
    msg.includes("review")
  ) {
    return `### ⚡ 3-Day Rapid Revision Plan

Here is a high-impact checklist to prepare before your upcoming exam:

*   **Day 1: Theory & Core Concepts (Focus on Weak Areas)**
    *   Revisit your identified weak areas (e.g. *CSS Flexbox Layouts* or *SQL Queries*).
    *   Review official reference documentation in the Resource Hub.
*   **Day 2: Hands-on Code & Layouts**
    *   Open your past local projects and refactor them with strict type safety.
    *   Pass at least 2 section video quizzes to solidify your practical skills.
*   **Day 3: Self-Testing & Diagnostic**
    *   Generate a mock quiz here in the AI Coach tab.
    *   Sleep well and take the final assessment with a clear mind!`;
  }

  // 7. RECOMMEND RESOURCES INSIDE EDUSYNC
  if (
    msg.includes("resource") ||
    msg.includes("pdf") ||
    msg.includes("notes") ||
    msg.includes("recommend") ||
    msg.includes("material")
  ) {
    const list = RESOURCE_SUGGESTIONS[focusDomain] || RESOURCE_SUGGESTIONS.Mobile;
    return `### 📚 Recommended Learning Resources inside EduSync

Here are the top-rated notes, articles, and courses matching your current goal:

${list.map((item) => `• **${item}** (Highly Recommended)`).join("\n")}

You can find all of these files in the **Resource Hub** tab or directly inside your **Continue Learning** dashboard container!`;
  }

  // 8. EXPLAIN AN EDUCATIONAL CONCEPT
  if (
    msg.includes("explain") ||
    msg.includes("what is") ||
    msg.includes("how does") ||
    msg.includes("concept") ||
    msg.includes("why")
  ) {
    const concept =
      message.replace(/explain|what is|how does|why/gi, "").trim() ||
      `${focusDomain} State Hydration`;
    return `### 📖 Educational Concept: ${concept}

Here is a simple yet detailed breakdown of **${concept}**:

#### 1. Core Definition
At a high level, **${concept}** represents the mechanism where the system initializes and connects structural configurations to dynamic runtimes. It makes static templates responsive by overlaying dynamic data streams.

#### 2. Analogy (Explain Like I'm 5)
Imagine you have a coloring book (the static layout). The templates and drawings are already printed, but there is no color. **State Hydration** is like a magic brush that automatically paints all the empty spaces with the colors you picked earlier, turning it into a beautiful, personalized painting instantly.

#### 3. Practical Example
Here is how it is structured in a simple code sequence:
\`\`\`typescript
// The static template is hydrated on runtime load
function hydrateComponent(staticLayout, dynamicData) {
  const responsiveState = { ...staticLayout, ...dynamicData };
  console.log("Component Hydration Successful:", responsiveState);
  return responsiveState;
}

hydrateComponent({ title: "My Course" }, { progress: 85 });
\`\`\`

#### 4. Key Takeaways
- Hydration bridges static markup and active user-state.
- It reduces initial loading times while keeping the app responsive.
- Syncing errors happen when server-side variables differ from the client cache.

Would you like me to explain any other concept or provide another example?`;
  }

  // 9. GENERAL / FOLLOW-UP MEMORY
  if (history.length > 1) {
    const lastUserMsg =
      history
        .slice()
        .reverse()
        .find((h) => h.from === "me")?.text || "";
    return `### 💬 AI Mentor Response

I completely hear you! Following up on our discussion about "**${lastUserMsg}**":

That is exactly correct. When dealing with **${focusDomain}** setups, the key is to ensure that state updates propagate correctly. In our context, this means that:
1. Your course progress syncs to Supabase.
2. The user experience remains fluid without constant survey interruptions.

Would you like me to provide a code example for this follow-up, generate a quick quiz, or build a week-by-week study plan for you?`;
  }

  // DEFAULT CHAT GREETING
  return `### 🎓 Welcome to the AI Learning Hub!

Hello! I am your **EduSync AI Coach**. I am here to help you guide your learning path. 

I can take care of all your academic tasks:
- 📖 **Explain concepts** (e.g., "Explain Javascript Closures")
- 🧠 **Generate quizzes** (e.g., "Give me an SQL quiz")
- 📅 **Create study plans** (e.g., "Create a study plan for frontend")
- 💼 **Recommend career paths** (e.g., "Career paths for AI dev")
- 🎤 **Mock interviews** (e.g., "Generate interview questions")
- ⚡ **Suggest exam revision plans**
- 📚 **Recommend learning resources** inside EduSync.

How can I help you today?`;
}
