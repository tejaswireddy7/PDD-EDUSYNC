import { supabase } from "../config/supabase";
import { AppError, errorCodes } from "../utils/errors";
import { SurveyAnswers } from "../types";

export const createSurvey = async (
  userId: string,
  answers: SurveyAnswers
): Promise<{
  surveyId: string;
  nextResuveyAt: string;
  nextSkipAt: string;
}> => {
  try {
    // Calculate next survey date (7 days from now)
    const nextSurveyDate = new Date();
    nextSurveyDate.setDate(nextSurveyDate.getDate() + 7);

    // Create survey
    const { data, error } = await supabase
      .from("surveys")
      .insert({
        userId,
        focusDomain: answers.focusDomain,
        proficiency: answers.proficiency,
        learningHours: answers.learningHours,
        nextSurveyAt: nextSurveyDate.toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create survey");
    }

    return {
      surveyId: data.id,
      nextResuveyAt: nextSurveyDate.toISOString(),
      nextSkipAt: nextSurveyDate.toISOString(),
    };
  } catch (error) {
    console.error("Error creating survey:", error);
    throw new AppError(
      "Error creating survey",
      errorCodes.DATABASE_ERROR.code,
      errorCodes.DATABASE_ERROR.statusCode
    );
  }
};

export const getLatestSurvey = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("surveys")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching survey from Supabase:", error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const survey = data[0];
    return {
      ...survey,
      createdAt: new Date(survey.createdAt),
      nextSurveyAt: new Date(survey.nextSurveyAt),
      skippedAt: survey.skippedAt ? new Date(survey.skippedAt) : null,
    };
  } catch (error) {
    console.error("Error fetching survey:", error);
    return null;
  }
};

export const skipSurvey = async (userId: string): Promise<string> => {
  try {
    const survey = await getLatestSurvey(userId);

    if (!survey) {
      throw new AppError(
        "No survey found to skip",
        errorCodes.SURVEY_NOT_FOUND.code,
        errorCodes.SURVEY_NOT_FOUND.statusCode
      );
    }

    // Push survey date by 7 more days
    const newNextSurveyDate = new Date(survey.nextSurveyAt);
    newNextSurveyDate.setDate(newNextSurveyDate.getDate() + 7);

    const { error: updateError } = await supabase
      .from("surveys")
      .update({
        nextSurveyAt: newNextSurveyDate.toISOString(),
        skippedAt: new Date().toISOString(),
      })
      .eq("id", survey.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return newNextSurveyDate.toISOString();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      "Error skipping survey",
      errorCodes.DATABASE_ERROR.code,
      errorCodes.DATABASE_ERROR.statusCode
    );
  }
};

export const shouldShowSurveyPrompt = async (userId: string): Promise<boolean> => {
  try {
    const survey = await getLatestSurvey(userId);

    if (!survey) {
      // New user - show survey
      return true;
    }

    // Check if next survey date has passed
    return new Date() >= survey.nextSurveyAt;
  } catch (error) {
    console.error("Error checking survey prompt:", error);
    return false;
  }
};

