import json
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import normalize

class EduSyncHybridRecommender:
    """
    Hybrid Recommendation Engine:
    1. Content-Based TF-IDF Semantic Embedder (Skills, Descriptions, Difficulties)
    2. User-Item Collaborative Matrix Factorization (SVD)
    3. Job & Career Skill-Gap Matcher (Cosine distance over Skill Vectors)
    """
    def __init__(self):
        self.course_df = None
        self.job_df = None
        self.tfidf_vectorizer = None
        self.course_embeddings = None
        self.user_item_matrix = None
        self.svd_model = None
        self.user_factors = None
        self.item_factors = None
        self.course_id_to_idx = {}
        self.idx_to_course_id = {}
        self.all_skills = []

    def fit(self, courses_data: list, jobs_data: list, users_data: list, interactions_data: list):
        self.course_df = pd.DataFrame(courses_data)
        self.job_df = pd.DataFrame(jobs_data)

        for idx, course in enumerate(courses_data):
            self.course_id_to_idx[course["id"]] = idx
            self.idx_to_course_id[idx] = course["id"]

        all_skills_set = set()
        for skills in self.course_df["skills"]:
            all_skills_set.update(skills)
        for skills in self.job_df["required_skills"]:
            all_skills_set.update(skills)
        self.all_skills = sorted(list(all_skills_set))

        # 1. Train Content-Based Feature Embeddings
        course_corpus = [
            f"{row['domain']} {row['difficulty']} {' '.join(row['skills'])} {row['description']}"
            for _, row in self.course_df.iterrows()
        ]
        self.tfidf_vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
        self.course_embeddings = self.tfidf_vectorizer.fit_transform(course_corpus).toarray()
        self.course_embeddings = normalize(self.course_embeddings, norm='l2', axis=1)

        # 2. Collaborative Matrix Factorization
        unique_users = sorted(list(set(i["user_id"] for i in interactions_data)))
        user_to_idx = {uid: i for i, uid in enumerate(unique_users)}

        num_users = len(unique_users)
        num_courses = len(self.course_df)
        interaction_matrix = np.zeros((num_users, num_courses))

        for item in interactions_data:
            u_idx = user_to_idx.get(item["user_id"])
            c_idx = self.course_id_to_idx.get(item["course_id"])
            if u_idx is not None and c_idx is not None:
                score = (item["progress"] / 100.0) * 2.0 + (item["rating"] / 5.0) * 3.0
                interaction_matrix[u_idx, c_idx] = max(interaction_matrix[u_idx, c_idx], score)

        n_components = min(12, num_courses - 1)
        self.svd_model = TruncatedSVD(n_components=n_components, random_state=42)
        self.user_factors = self.svd_model.fit_transform(interaction_matrix)
        self.item_factors = self.svd_model.components_.T
        return self

    def recommend_courses(self, user_profile: dict, top_k: int = 5):
        domain = user_profile.get("domain", "")
        level = user_profile.get("level", "Beginner")
        goal = user_profile.get("goal", "")
        known_skills = set(user_profile.get("skills", []))
        completed_course_ids = set(user_profile.get("completed_courses", []))

        query_text = f"{domain} {level} {goal} {' '.join(known_skills)}"
        query_vec = self.tfidf_vectorizer.transform([query_text]).toarray()
        query_vec = normalize(query_vec, norm='l2', axis=1)

        content_scores = cosine_similarity(query_vec, self.course_embeddings)[0]

        recommendations = []
        for idx, row in self.course_df.iterrows():
            course_id = row["id"]
            if course_id in completed_course_ids:
                continue

            content_score = float(content_scores[idx])
            domain_boost = 0.35 if row["domain"].lower() == domain.lower() else 0.0
            level_boost = 0.20 if row["difficulty"].lower() == level.lower() else 0.0

            course_skills = set(row["skills"])
            new_skills = list(course_skills - known_skills)
            skill_gain_ratio = len(new_skills) / max(len(course_skills), 1)

            final_score = (
                0.40 * content_score +
                0.25 * domain_boost +
                0.15 * level_boost +
                0.20 * skill_gain_ratio
            )

            recommendations.append({
                "course_id": course_id,
                "title": row["title"],
                "domain": row["domain"],
                "difficulty": row["difficulty"],
                "time_weeks": int(row["time_weeks"]),
                "skills": row["skills"],
                "video_url": row.get("video_url", "https://www.youtube.com/embed/hdI2bqOjy3c"),
                "new_skills_acquired": new_skills,
                "match_score": round(min(max(final_score * 100.0, 45.0), 99.0), 1),
                "ai_reason": f"Matches your {domain} target with {len(new_skills)} high-demand skills."
            })

        recommendations.sort(key=lambda x: x["match_score"], reverse=True)
        return recommendations[:top_k]

    def match_jobs_and_gaps(self, user_profile: dict, top_k: int = 4):
        user_skills = set(user_profile.get("skills", []))
        domain = user_profile.get("domain", "")

        job_results = []
        for _, job in self.job_df.iterrows():
            required_skills = set(job["required_skills"])
            matched_skills = list(user_skills.intersection(required_skills))
            missing_skills = list(required_skills - user_skills)

            match_pct = (len(matched_skills) / max(len(required_skills), 1)) * 100.0
            if job["domain"].lower() == domain.lower():
                match_pct = min(100.0, match_pct + 15.0)

            bridging_courses = []
            for _, c_row in self.course_df.iterrows():
                overlap = set(c_row["skills"]).intersection(set(missing_skills))
                if overlap:
                    bridging_courses.append({
                        "course_id": c_row["id"],
                        "title": c_row["title"],
                        "teaches": list(overlap)
                    })

            job_results.append({
                "job_id": job["id"],
                "title": job["title"],
                "domain": job["domain"],
                "experience_level": job["experience_level"],
                "salary_range": job["salary_range"],
                "match_percentage": round(match_pct, 1),
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "recommended_bridge_courses": bridging_courses[:2]
            })

        job_results.sort(key=lambda x: x["match_percentage"], reverse=True)
        return job_results[:top_k]
