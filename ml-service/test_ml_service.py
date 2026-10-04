import requests

base_url = "http://127.0.0.1:8000"

def test_all():
    print("=== Testing EduSync AI/ML Microservice ===")

    # 1. Health
    h = requests.get(f"{base_url}/health").json()
    print("1. Health Check:", h)

    # 2. Course Recommendations
    course_res = requests.post(f"{base_url}/api/v1/recommend/courses", json={
        "user_id": "u101",
        "domain": "Frontend",
        "level": "Beginner",
        "goal": "Career Switch",
        "skills": ["HTML", "CSS"]
    }).json()
    print("\n2. Course Recommendations:")
    for r in course_res["recommendations"][:3]:
        print(f"   * [{r['match_score']}%] {r['title']} ({r['difficulty']}) - {r['ai_reason']}")

    # 3. Job Suggestions & Skill-Gap Bridging
    job_res = requests.post(f"{base_url}/api/v1/recommend/jobs", json={
        "user_id": "u101",
        "domain": "Frontend",
        "level": "Beginner",
        "skills": ["HTML", "CSS", "JavaScript"]
    }).json()
    print("\n3. Job Suggestions & Gap Analysis:")
    for j in job_res["career_matches"][:2]:
        print(f"   * {j['title']} (Match: {j['match_percentage']}%)")
        print(f"     Missing Skills: {j['missing_skills']}")
        if j['recommended_bridge_courses']:
            print(f"     Recommended Bridge Course: {j['recommended_bridge_courses'][0]['title']}")

    # 4. Adaptive Assessment (IRT)
    next_q = requests.post(f"{base_url}/api/v1/adaptive/next-question", json={
        "domain": "Frontend",
        "current_theta": 0.2,
        "answered_question_ids": []
    }).json()
    print("\n4. Adaptive Assessment Question Selection:")
    q_data = next_q["question"]
    print(f"   * Question ID: {q_data['id']} (Level: {q_data['difficulty_label']})")
    print(f"     Prompt: {q_data['question']}")

    # 5. Telemetry Logging (Continuous Self-Improvement)
    telemetry_res = requests.post(f"{base_url}/api/v1/telemetry/event", json={
        "user_id": "u101",
        "event_type": "course_progress",
        "course_id": "fe-002",
        "domain": "Frontend",
        "progress": 100,
        "rating": 5,
        "completed": True
    }).json()
    print("\n5. Telemetry Ingestion for Active Learning:", telemetry_res)

    print("\nAll ML microservice checks passed successfully!")

if __name__ == "__main__":
    test_all()
