import math
import numpy as np

class EduSyncAdaptiveAssessmentEngine:
    """
    2-Parameter Logistic (2PL) Item Response Theory (IRT) Model &
    Computerized Adaptive Testing (CAT) Engine with Maximum Fisher Information Selection.
    """
    def __init__(self):
        self.question_bank = []
        self.question_dict = {}

    def fit(self, questions_data: list):
        self.question_bank = questions_data
        for q in self.question_bank:
            self.question_dict[q["id"]] = q
        return self

    @staticmethod
    def probability_correct(theta: float, a: float, b: float) -> float:
        z = a * (theta - b)
        z = max(min(z, 20.0), -20.0)
        return 1.0 / (1.0 + math.exp(-z))

    def fisher_information(self, theta: float, a: float, b: float) -> float:
        p = self.probability_correct(theta, a, b)
        return (a ** 2) * p * (1.0 - p)

    def estimate_ability_eap(self, responses: list[dict]) -> tuple[float, float]:
        if not responses:
            return 0.0, 1.0

        quad_points = np.linspace(-3.5, 3.5, 71)
        prior = np.exp(-0.5 * quad_points**2) / np.sqrt(2 * np.pi)

        likelihood = np.ones_like(quad_points)
        for resp in responses:
            q_id = resp["question_id"]
            is_correct = resp["is_correct"]
            q = self.question_dict.get(q_id)
            if not q:
                continue

            a = q.get("discrimination_a", 1.0)
            b = q.get("difficulty_b", 0.0)

            for idx, theta in enumerate(quad_points):
                p = self.probability_correct(theta, a, b)
                prob = p if is_correct else (1.0 - p)
                likelihood[idx] *= max(prob, 1e-7)

        posterior = likelihood * prior
        posterior_sum = np.sum(posterior)
        if posterior_sum == 0:
            return 0.0, 1.0

        posterior /= posterior_sum

        estimated_theta = float(np.sum(quad_points * posterior))
        variance = float(np.sum(((quad_points - estimated_theta) ** 2) * posterior))
        standard_error = float(math.sqrt(max(variance, 0.01)))

        return round(estimated_theta, 3), round(standard_error, 3)

    def select_next_question(self, domain: str, current_theta: float, answered_ids: set) -> dict | None:
        candidates = [
            q for q in self.question_bank
            if (domain.lower() in q["domain"].lower() or q["domain"].lower() in domain.lower())
            and q["id"] not in answered_ids
        ]

        if not candidates:
            candidates = [q for q in self.question_bank if q["id"] not in answered_ids]

        if not candidates:
            return None

        def info_score(q):
            return self.fisher_information(
                current_theta,
                q.get("discrimination_a", 1.2),
                q.get("difficulty_b", 0.0)
            )

        candidates.sort(key=info_score, reverse=True)
        best_q = candidates[0]

        b = best_q.get("difficulty_b", 0.0)
        diff_label = "Beginner" if b < -0.5 else ("Intermediate" if b < 0.8 else "Advanced")

        return {
            "id": best_q["id"],
            "domain": best_q["domain"],
            "skill": best_q["skill"],
            "question": best_q["question"],
            "options": best_q["options"],
            "difficulty_label": diff_label,
            "current_estimated_ability": current_theta
        }

    def convert_theta_to_mastery_percentile(self, theta: float) -> dict:
        z = theta
        percentile = 0.5 * (1.0 + math.erf(z / math.sqrt(2.0))) * 100.0
        score = round(percentile, 1)

        if score < 35:
            grade = "Novice"
        elif score < 65:
            grade = "Proficient"
        elif score < 85:
            grade = "Advanced"
        else:
            grade = "Expert"

        return {
            "theta_score": theta,
            "mastery_percentile": score,
            "grade": grade
        }
