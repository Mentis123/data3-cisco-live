import { participants, submissions, type Participant, type InsertParticipant, type Submission, type InsertSubmission } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getParticipant(id: string): Promise<Participant | undefined>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getLeaderboard(limit?: number, category?: string): Promise<Array<{
    id: string;
    name: string;
    category: string;
    totalScore: number;
    createdAt: Date;
  }>>;
  getSubmissionCount(): Promise<number>;
  clearDatabase(): Promise<void>;
  getSubmissionDetails(id: string): Promise<{
    id: string;
    participantName: string;
    category: string;
    totalScore: number;
    subScores: any;
    solutionText: string;
    structuredJson: any;
    evaluationNotes: string | null;
    createdAt: Date;
  } | undefined>;
  getDetailedLeaderboard(): Promise<Array<{
    id: string;
    name: string;
    category: string;
    totalScore: number;
    subScores: any;
    evaluationNotes: string | null;
    createdAt: Date;
  }>>;
  deleteSubmission(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getParticipant(id: string): Promise<Participant | undefined> {
    const [participant] = await db.select().from(participants).where(eq(participants.id, id));
    return participant || undefined;
  }

  async createParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    const [participant] = await db
      .insert(participants)
      .values(insertParticipant)
      .returning();
    return participant;
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const [submission] = await db
      .insert(submissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  async getLeaderboard(limit = 100, category?: string): Promise<Array<{
    id: string;
    name: string;
    category: string;
    totalScore: number;
    createdAt: Date;
  }>> {
    let query = db
      .select({
        id: submissions.id,
        firstName: participants.firstName,
        lastName: participants.lastName,
        category: submissions.category,
        totalScore: submissions.totalScore,
        createdAt: submissions.createdAt,
      })
      .from(submissions)
      .innerJoin(participants, eq(submissions.participantId, participants.id));

    // Filter by category if provided
    if (category) {
      query = query.where(eq(submissions.category, category));
    }

    const results = await query
      .orderBy(desc(submissions.totalScore), desc(submissions.createdAt))
      .limit(limit);

    return results.map(result => ({
      id: result.id,
      name: `${result.firstName} ${result.lastName.charAt(0)}.`,
      category: result.category,
      totalScore: result.totalScore,
      createdAt: result.createdAt!,
    }));
  }

  async getSubmissionCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions);
    return result.count;
  }

  async clearDatabase(): Promise<void> {
    await db.delete(submissions);
    await db.delete(participants);
  }

  async getSubmissionDetails(id: string): Promise<{
    id: string;
    participantName: string;
    category: string;
    totalScore: number;
    subScores: any;
    solutionText: string;
    structuredJson: any;
    evaluationNotes: string | null;
    createdAt: Date;
  } | undefined> {
    const [result] = await db
      .select({
        id: submissions.id,
        firstName: participants.firstName,
        lastName: participants.lastName,
        category: submissions.category,
        totalScore: submissions.totalScore,
        subScores: submissions.subScores,
        solutionText: submissions.solutionText,
        structuredJson: submissions.structuredJson,
        evaluationNotes: submissions.evaluationNotes,
        createdAt: submissions.createdAt,
      })
      .from(submissions)
      .innerJoin(participants, eq(submissions.participantId, participants.id))
      .where(eq(submissions.id, id));

    if (!result) return undefined;

    return {
      id: result.id,
      participantName: `${result.firstName} ${result.lastName}`,
      category: result.category,
      totalScore: result.totalScore,
      subScores: result.subScores ? JSON.parse(result.subScores) : null,
      solutionText: result.solutionText,
      structuredJson: result.structuredJson ? JSON.parse(result.structuredJson) : null,
      evaluationNotes: result.evaluationNotes,
      createdAt: result.createdAt!,
    };
  }

  async getDetailedLeaderboard(): Promise<Array<{
    id: string;
    name: string;
    category: string;
    totalScore: number;
    subScores: any;
    evaluationNotes: string | null;
    createdAt: Date;
  }>> {
    const results = await db
      .select({
        id: submissions.id,
        firstName: participants.firstName,
        lastName: participants.lastName,
        category: submissions.category,
        totalScore: submissions.totalScore,
        subScores: submissions.subScores,
        evaluationNotes: submissions.evaluationNotes,
        createdAt: submissions.createdAt,
      })
      .from(submissions)
      .innerJoin(participants, eq(submissions.participantId, participants.id))
      .orderBy(desc(submissions.totalScore), desc(submissions.createdAt));

    return results.map(result => ({
      id: result.id,
      name: `${result.firstName} ${result.lastName}`,
      category: result.category,
      totalScore: result.totalScore,
      subScores: result.subScores ? JSON.parse(result.subScores) : null,
      evaluationNotes: result.evaluationNotes,
      createdAt: result.createdAt!,
    }));
  }

  async deleteSubmission(id: string): Promise<boolean> {
    const result = await db
      .delete(submissions)
      .where(eq(submissions.id, id));

    return result.changes > 0;
  }
}

export const storage = new DatabaseStorage();