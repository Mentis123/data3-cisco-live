#!/usr/bin/env tsx

import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { db } from '../server/db.js';
import { submissions, participants, users, chatSessions, attempts } from '../shared/schema.js';
import * as fs from 'fs';
import * as path from 'path';
import { createWriteStream } from 'fs';
import archiver from 'archiver';

interface SubmissionExport {
  submissionId: string;
  submissionDate: string;
  firstName: string;
  lastName: string;
  email: string;
  category: string;
  solutionText: string;
  structuredData: any;
  totalScore: number;
  subScores: any;
  chatTranscript: Array<{ role: string; content: string; timestamp?: string }>;
}

async function exportSubmissions(startDate: string, endDate: string) {
  console.log(`Exporting submissions from ${startDate} to ${endDate}...`);

  // Query all submissions within the date range
  const submissionsData = await db
    .select({
      submissionId: submissions.id,
      submissionDate: submissions.createdAt,
      participantId: submissions.participantId,
      category: submissions.category,
      solutionText: submissions.solutionText,
      structuredJson: submissions.structuredJson,
      totalScore: submissions.totalScore,
      subScores: submissions.subScores,
      firstName: participants.firstName,
      lastName: participants.lastName,
      emailHash: sql<string>`COALESCE(${users.emailHash}, ${attempts.emailHash})`,
      email: users.email,
    })
    .from(submissions)
    .innerJoin(participants, eq(submissions.participantId, participants.id))
    .leftJoin(attempts, eq(submissions.id, attempts.submissionId))
    .leftJoin(users, eq(attempts.emailHash, users.emailHash))
    .where(
      and(
        gte(submissions.createdAt, new Date(startDate)),
        lte(submissions.createdAt, new Date(`${endDate}T23:59:59.999Z`))
      )
    )
    .orderBy(submissions.createdAt);

  console.log(`Found ${submissionsData.length} submissions`);

  const exportData: SubmissionExport[] = [];

  for (const submission of submissionsData) {
    // Get chat session for this participant
    let chatTranscript: Array<{ role: string; content: string; timestamp?: string }> = [];

    try {
      const chatSession = await db
        .select()
        .from(chatSessions)
        .where(
          and(
            eq(chatSessions.participantId, submission.participantId),
            eq(chatSessions.category, submission.category)
          )
        )
        .limit(1);

      if (chatSession.length > 0 && chatSession[0].messages) {
        chatTranscript = chatSession[0].messages as Array<{ role: string; content: string; timestamp?: string }>;
      }
    } catch (error) {
      console.error(`Error fetching chat session for participant ${submission.participantId}:`, error);
    }

    exportData.push({
      submissionId: submission.submissionId,
      submissionDate: submission.submissionDate.toISOString(),
      firstName: submission.firstName,
      lastName: submission.lastName,
      email: submission.email || 'Not available',
      category: submission.category,
      solutionText: submission.solutionText,
      structuredData: submission.structuredJson ? JSON.parse(submission.structuredJson) : null,
      totalScore: submission.totalScore,
      subScores: submission.subScores ? JSON.parse(submission.subScores) : null,
      chatTranscript,
    });
  }

  return exportData;
}

function formatChatTranscript(transcript: Array<{ role: string; content: string; timestamp?: string }>): string {
  if (!transcript || transcript.length === 0) {
    return 'No chat transcript available';
  }

  return transcript
    .map((msg, index) => {
      const role = msg.role === 'user' ? 'PARTICIPANT' : 'SPRINT COACH';
      const timestamp = msg.timestamp ? ` [${msg.timestamp}]` : '';
      return `\n[${ index + 1}] ${role}${timestamp}:\n${msg.content}\n${'='.repeat(80)}`;
    })
    .join('\n');
}

async function createExportFiles(exportData: SubmissionExport[], outputDir: string) {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create a CSV file with summary data
  const csvLines = [
    'Submission ID,Date,First Name,Last Name,Email,Category,Total Score,Clarity Score,Impact Score,Technology Fit Score,Feasibility Score,Business Value Score',
  ];

  for (const entry of exportData) {
    const subScores = entry.subScores || {};
    csvLines.push(
      [
        entry.submissionId,
        entry.submissionDate,
        entry.firstName,
        entry.lastName,
        entry.email,
        entry.category,
        entry.totalScore,
        subScores.clarity || '',
        subScores.impact || '',
        subScores.technology_fit || '',
        subScores.feasibility || '',
        subScores.business_value || '',
      ]
        .map((field) => `"${String(field).replace(/"/g, '""')}"`)
        .join(',')
    );
  }

  const csvPath = path.join(outputDir, 'submissions_summary.csv');
  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');
  console.log(`Created CSV summary: ${csvPath}`);

  // Create detailed JSON file
  const jsonPath = path.join(outputDir, 'submissions_detailed.json');
  fs.writeFileSync(jsonPath, JSON.stringify(exportData, null, 2), 'utf-8');
  console.log(`Created detailed JSON: ${jsonPath}`);

  // Create individual text files for each submission with full details
  const submissionsDir = path.join(outputDir, 'individual_submissions');
  if (!fs.existsSync(submissionsDir)) {
    fs.mkdirSync(submissionsDir, { recursive: true });
  }

  for (const entry of exportData) {
    const fileName = `${entry.submissionDate.split('T')[0]}_${entry.lastName}_${entry.firstName}_${entry.category}.txt`
      .replace(/[^a-zA-Z0-9_\-\.]/g, '_');

    const filePath = path.join(submissionsDir, fileName);

    const structuredData = entry.structuredData || {};

    const content = `
================================================================================
SUBMISSION DETAILS
================================================================================

Submission ID: ${entry.submissionId}
Date of Submission: ${entry.submissionDate}
First Name: ${entry.firstName}
Last Name: ${entry.lastName}
Email: ${entry.email}
Category: ${entry.category}
Total Score: ${entry.totalScore}

--------------------------------------------------------------------------------
SUB-SCORES
--------------------------------------------------------------------------------
${entry.subScores ? Object.entries(entry.subScores)
  .map(([key, value]) => `${key.replace(/_/g, ' ').toUpperCase()}: ${value}`)
  .join('\n') : 'Not available'}

--------------------------------------------------------------------------------
PROJECT SUBMISSION DETAILS
--------------------------------------------------------------------------------

PROBLEM SUMMARY:
${structuredData.problem_summary || 'Not available'}

IMPACT SUMMARY:
${structuredData.impact_summary || 'Not available'}

BASELINE METRICS:
${structuredData.baseline_metrics ? structuredData.baseline_metrics
  .map((m: any) => `- ${m.name}: ${m.value}`)
  .join('\n') : 'Not available'}

TARGET METRICS:
${structuredData.target_metrics ? structuredData.target_metrics
  .map((m: any) => `- ${m.name}: ${m.target}`)
  .join('\n') : 'Not available'}

ACTION PLAN:
${structuredData.action_plan ? structuredData.action_plan
  .map((step: string, i: number) => `${i + 1}. ${step}`)
  .join('\n') : 'Not available'}

SUCCESS CHECKS:
${structuredData.success_checks ? structuredData.success_checks
  .map((check: string, i: number) => `${i + 1}. ${check}`)
  .join('\n') : 'Not available'}

RISKS:
${structuredData.risks ? structuredData.risks
  .map((risk: string, i: number) => `${i + 1}. ${risk}`)
  .join('\n') : 'Not available'}

FULL SOLUTION TEXT:
${entry.solutionText}

================================================================================
SPRINT COACH CHAT TRANSCRIPT
================================================================================
${formatChatTranscript(entry.chatTranscript)}

================================================================================
END OF SUBMISSION
================================================================================
`;

    fs.writeFileSync(filePath, content.trim(), 'utf-8');
  }

  console.log(`Created ${exportData.length} individual submission files in ${submissionsDir}`);
}

async function createZipArchive(sourceDir: string, outputZipPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputZipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`ZIP archive created: ${outputZipPath}`);
      console.log(`Total size: ${archive.pointer()} bytes`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function main() {
  if (!db) {
    console.error('Error: Database connection not available. Please check DATABASE_URL environment variable.');
    process.exit(1);
  }

  const args = process.argv.slice(2);

  let startDate = '2025-11-10T00:00:00.000Z';
  let endDate = '2025-11-13T23:59:59.999Z';

  if (args.length >= 2) {
    startDate = args[0];
    endDate = args[1];
  }

  console.log('Starting export process...');
  console.log(`Date range: ${startDate} to ${endDate}`);

  try {
    // Export submissions
    const exportData = await exportSubmissions(startDate, endDate);

    if (exportData.length === 0) {
      console.log('No submissions found in the specified date range.');
      process.exit(0);
    }

    // Create output directory
    const timestamp = new Date().toISOString().split('T')[0];
    const outputDir = path.join(process.cwd(), 'exports', `submissions_${timestamp}`);

    // Create files
    await createExportFiles(exportData, outputDir);

    // Create ZIP archive
    const zipPath = path.join(process.cwd(), 'exports', `submissions_${startDate.split('T')[0]}_to_${endDate.split('T')[0]}.zip`);
    await createZipArchive(outputDir, zipPath);

    console.log('\n✓ Export completed successfully!');
    console.log(`✓ ZIP file ready for download: ${zipPath}`);
    console.log(`✓ Total submissions exported: ${exportData.length}`);

  } catch (error) {
    console.error('Error during export:', error);
    process.exit(1);
  }
}

main();
