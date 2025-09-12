
import Database from "better-sqlite3";
import type { InsertParticipant, InsertSubmission, Participant, Submission } from "@shared/schema";

const db = new Database("database.sqlite");

// Initialize database with tables
db.exec(`
  CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    participant_id TEXT NOT NULL REFERENCES participants(id),
    category TEXT NOT NULL,
    solution_text TEXT NOT NULL,
    structured_json TEXT NOT NULL,
    sub_scores TEXT NOT NULL,
    total_score INTEGER NOT NULL,
    evaluation_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS data3_stats (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    title TEXT NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Pre-populate Data#3 stats
const data3Stats = [
  { title: "Team Members", value: "1,200+", description: "Across Australia & New Zealand", category: "SCALE", display_order: 1 },
  { title: "Years in Business", value: "45+", description: "Trusted technology partner since 1978", category: "SCALE", display_order: 2 },
  { title: "Cisco Certifications", value: "500+", description: "Expert-level certified professionals", category: "EXPERTISE", display_order: 3 },
  { title: "Enterprise Customers", value: "8,000+", description: "From SMB to Fortune 500", category: "SCALE", display_order: 4 },
  { title: "Data Centres", value: "15+", description: "Sovereign cloud infrastructure", category: "INFRASTRUCTURE", display_order: 5 },
  { title: "Security Operations", value: "24/7", description: "Always-on threat monitoring", category: "SECURITY", display_order: 6 },
  { title: "Cloud Migrations", value: "2,000+", description: "Successful digital transformations", category: "CLOUD", display_order: 7 },
  { title: "Network Endpoints", value: "1M+", description: "Devices under management", category: "NETWORKING", display_order: 8 },
  { title: "Cisco Gold Partner", value: "Premier", description: "Highest tier partnership status", category: "EXPERTISE", display_order: 9 },
  { title: "Annual Revenue", value: "$1.8B+", description: "Sustained growth and investment", category: "SCALE", display_order: 10 }
];

// Insert Data#3 stats if they don't exist
const insertData3Stat = db.prepare(`
  INSERT OR IGNORE INTO data3_stats (title, value, description, category, display_order)
  VALUES (?, ?, ?, ?, ?)
`);

for (const stat of data3Stats) {
  insertData3Stat.run(stat.title, stat.value, stat.description, stat.category, stat.display_order);
}

export const storage = {
  async createParticipant(data: InsertParticipant): Promise<Participant> {
    const stmt = db.prepare(`
      INSERT INTO participants (first_name, last_name)
      VALUES (?, ?)
      RETURNING *
    `);
    return stmt.get(data.firstName, data.lastName) as Participant;
  },

  async getParticipant(id: string): Promise<Participant | null> {
    const stmt = db.prepare("SELECT * FROM participants WHERE id = ?");
    return stmt.get(id) as Participant | null;
  },

  async createSubmission(data: InsertSubmission): Promise<Submission> {
    const stmt = db.prepare(`
      INSERT INTO submissions (participant_id, category, solution_text, structured_json, sub_scores, total_score, evaluation_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `);
    return stmt.get(
      data.participantId,
      data.category,
      data.solutionText,
      data.structuredJson,
      data.subScores,
      data.totalScore,
      data.evaluationNotes
    ) as Submission;
  },

  async getLeaderboard(limit: number = 100, category?: string): Promise<any[]> {
    let query = `
      SELECT 
        s.id,
        s.total_score as totalScore,
        s.category,
        s.created_at as createdAt,
        p.first_name || ' ' || substr(p.last_name, 1, 1) || '.' as name
      FROM submissions s
      JOIN participants p ON s.participant_id = p.id
    `;

    const params: any[] = [];
    if (category) {
      query += " WHERE s.category = ?";
      params.push(category);
    }

    query += " ORDER BY s.total_score DESC, s.created_at ASC LIMIT ?";
    params.push(limit);

    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  async getDetailedLeaderboard(): Promise<any[]> {
    const stmt = db.prepare(`
      SELECT 
        s.*,
        p.first_name as firstName,
        p.last_name as lastName
      FROM submissions s
      JOIN participants p ON s.participant_id = p.id
      ORDER BY s.total_score DESC, s.created_at ASC
    `);
    return stmt.all();
  },

  async getSubmissionDetails(id: string): Promise<any> {
    const stmt = db.prepare(`
      SELECT 
        s.*,
        p.first_name as firstName,
        p.last_name as lastName
      FROM submissions s
      JOIN participants p ON s.participant_id = p.id
      WHERE s.id = ?
    `);
    return stmt.get(id);
  },

  async deleteSubmission(id: string): Promise<boolean> {
    const stmt = db.prepare("DELETE FROM submissions WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  },

  async getWordCloudData(): Promise<{ text: string; value: number }[]> {
    const submissions = db.prepare("SELECT structured_json, solution_text FROM submissions").all();
    const wordFreq: { [key: string]: number } = {};

    submissions.forEach((submission: any) => {
      // Extract cisco products from structured JSON
      try {
        const structured = JSON.parse(submission.structured_json);
        const products = structured.cisco_products || [];
        products.forEach((product: string) => {
          const cleanProduct = product.trim();
          wordFreq[cleanProduct] = (wordFreq[cleanProduct] || 0) + 3; // Weight products higher
        });
      } catch (e) {
        // Fallback to solution text parsing
      }

      // Extract key technology terms from solution text
      const techTerms = submission.solution_text.match(/\b(Catalyst|ThousandEyes|AppDynamics|Webex|Meraki|SecureX|ACI|Nexus|UCS|SD-WAN|Zero Trust|Umbrella|Duo|ISE|DNA|SASE|Intersight|Stealthwatch)\b/gi) || [];
      techTerms.forEach((term: string) => {
        const cleanTerm = term.toLowerCase();
        wordFreq[cleanTerm] = (wordFreq[cleanTerm] || 0) + 1;
      });
    });

    return Object.entries(wordFreq)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 30); // Top 30 terms
  },

  async getCategoryStats(): Promise<{ [key: string]: number }> {
    const stmt = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM submissions 
      GROUP BY category
    `);
    const results = stmt.all() as { category: string; count: number }[];
    
    const stats: { [key: string]: number } = {};
    results.forEach(row => {
      stats[row.category] = row.count;
    });
    
    return stats;
  },

  async getData3Stats(category?: string): Promise<any[]> {
    let query = "SELECT * FROM data3_stats";
    const params: any[] = [];
    
    if (category) {
      query += " WHERE category = ?";
      params.push(category);
    }
    
    query += " ORDER BY display_order";
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  async getRecentSubmission(): Promise<any> {
    const stmt = db.prepare(`
      SELECT 
        s.*,
        p.first_name || ' ' || substr(p.last_name, 1, 1) || '.' as name
      FROM submissions s
      JOIN participants p ON s.participant_id = p.id
      ORDER BY s.created_at DESC
      LIMIT 1
    `);
    return stmt.get();
  },

  async getTopProblemCategory(): Promise<string> {
    const stmt = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM submissions 
      GROUP BY category 
      ORDER BY count DESC 
      LIMIT 1
    `);
    const result = stmt.get() as { category: string; count: number } | undefined;
    return result?.category || "SECURE_CONNECTIVITY";
  },

  async clearDatabase(): Promise<void> {
    db.exec("DELETE FROM submissions");
    db.exec("DELETE FROM participants");
    // Don't clear data3_stats as they are reference data
  }
};
