import { participants, submissions, type Participant, type InsertParticipant, type Submission, type InsertSubmission } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getParticipant(id: string): Promise<Participant | undefined>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getLeaderboard(limit?: number): Promise<Array<{
    id: string;
    name: string;
    category: string;
    totalScore: number;
    createdAt: Date;
  }>>;
  getSubmissionCount(): Promise<number>;
  clearDatabase(): Promise<void>;
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

  async getLeaderboard(limit = 100): Promise<Array<{
    id: string;
    name: string;
    category: string;
    totalScore: number;
    createdAt: Date;
  }>> {
    const results = await db
      .select({
        id: submissions.id,
        firstName: participants.firstName,
        lastName: participants.lastName,
        category: submissions.category,
        totalScore: submissions.totalScore,
        createdAt: submissions.createdAt,
      })
      .from(submissions)
      .innerJoin(participants, eq(submissions.participantId, participants.id))
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
}

export const storage = new DatabaseStorage();
