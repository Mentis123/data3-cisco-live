import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";
import { participants, submissions, data3Stats, customCategories } from "@shared/schema";
import type { InsertParticipant, InsertSubmission, Participant, Submission, Data3Stat, InsertCustomCategory, CustomCategory } from "@shared/schema";

// Pre-populate Data#3 stats
const defaultData3Stats = [
  { title: "Team Members", value: "1,500+", description: "Across Australia", category: "SCALE", displayOrder: 1 },
  { title: "Years in Business", value: "45+", description: "Trusted technology partner since 1978", category: "SCALE", displayOrder: 2 },
  { title: "Cisco Certifications", value: "500+", description: "Expert-level certified professionals", category: "EXPERTISE", displayOrder: 3 },
  { title: "Enterprise Customers", value: "8,000+", description: "From SMB to Fortune 500", category: "SCALE", displayOrder: 4 },
  { title: "Data Centres", value: "15+", description: "Sovereign cloud infrastructure", category: "INFRASTRUCTURE", displayOrder: 5 },
  { title: "Security Operations", value: "24/7", description: "Always-on threat monitoring", category: "SECURITY", displayOrder: 6 },
  { title: "Cloud Migrations", value: "2,000+", description: "Successful digital transformations", category: "CLOUD", displayOrder: 7 },
  { title: "Network Endpoints", value: "1M+", description: "Devices under management", category: "NETWORKING", displayOrder: 8 },
  { title: "Cisco Gold Partner", value: "Premier", description: "Highest tier partnership status", category: "EXPERTISE", displayOrder: 9 },
  { title: "Annual Revenue", value: "$1.8B+", description: "Sustained growth and investment", category: "SCALE", displayOrder: 10 }
];

// Default custom categories to initialize
const defaultCustomCategories = [
  { name: 'INFRASTRUCTURE', displayName: 'Infrastructure', color: 'bg-[#dc2626]' },
  { name: 'SECURITY', displayName: 'Security', color: 'bg-[#ca8a04]' },
  { name: 'CLOUD', displayName: 'Cloud', color: 'bg-[#2563eb]' },
  { name: 'NETWORKING', displayName: 'Networking', color: 'bg-[#7c3aed]' }
];

// Initialize stats and categories on startup (development only)
async function initializeData() {
  // Only initialize default data in development mode
  // Production should maintain its own data
  if (process.env.NODE_ENV === 'production') {
    console.log("Running in production - skipping default data initialization");
    return;
  }
  
  try {
    // Initialize stats
    const existingStats = await db.select().from(data3Stats);
    if (existingStats.length === 0) {
      await db.insert(data3Stats).values(defaultData3Stats);
      console.log("Data#3 stats initialized (development mode)");
    }
    
    // Initialize custom categories
    const existingCategories = await db.select().from(customCategories);
    if (existingCategories.length === 0) {
      await db.insert(customCategories).values(defaultCustomCategories);
      console.log("Custom categories initialized (development mode)");
    }
  } catch (e) {
    console.error("Error initializing data:", e);
  }
}

// Initialize on module load
initializeData();

// Define system category names that are reserved and cannot be used for custom categories
const SYSTEM_CATEGORY_NAMES = [
  'GENERAL',
  'SCALE',
  'EXPERTISE',
  'SECURE_CONNECTIVITY',
  'HYBRID_DC',
  'COLLAB_CX',
  'OBSERVABILITY',
  'EDGE_IOT'
] as const;

export const storage = {
  async createParticipant(data: InsertParticipant): Promise<Participant> {
    const [result] = await db.insert(participants).values(data).returning();
    return result;
  },

  async getParticipant(id: string): Promise<Participant | null> {
    const [result] = await db.select().from(participants).where(eq(participants.id, id));
    return result || null;
  },

  async createSubmission(data: InsertSubmission): Promise<Submission> {
    const [result] = await db.insert(submissions).values(data).returning();
    return result;
  },

  async getLeaderboard(limit: number = 100, category?: string): Promise<any[]> {
    const query = db
      .select({
        id: submissions.id,
        totalScore: submissions.totalScore,
        category: submissions.category,
        createdAt: submissions.createdAt,
        name: sql<string>`${participants.firstName} || ' ' || substr(${participants.lastName}, 1, 1) || '.'`,
      })
      .from(submissions)
      .innerJoin(participants, eq(submissions.participantId, participants.id))
      .orderBy(desc(submissions.totalScore), submissions.createdAt)
      .limit(limit);

    if (category) {
      return await query.where(eq(submissions.category, category));
    }

    return await query;
  },

  async getSubmission(id: string): Promise<any> {
    const [result] = await db
      .select({
        id: submissions.id,
        participantId: submissions.participantId,
        category: submissions.category,
        solutionText: submissions.solutionText,
        structuredJson: submissions.structuredJson,
        subScores: submissions.subScores,
        totalScore: submissions.totalScore,
        evaluationNotes: submissions.evaluationNotes,
        createdAt: submissions.createdAt,
        name: sql<string>`${participants.firstName} || ' ' || substr(${participants.lastName}, 1, 1) || '.'`,
      })
      .from(submissions)
      .innerJoin(participants, eq(submissions.participantId, participants.id))
      .where(eq(submissions.id, id));
    
    if (!result) return null;
    
    // Parse JSON strings for subScores and structuredJson
    return {
      ...result,
      subScores: typeof result.subScores === 'string' ? JSON.parse(result.subScores) : result.subScores,
      structuredJson: typeof result.structuredJson === 'string' ? JSON.parse(result.structuredJson) : result.structuredJson
    };
  },

  async getAdminLeaderboard(limit: number = 100): Promise<any[]> {
    const results = await db
      .select({
        id: submissions.id,
        totalScore: submissions.totalScore,
        category: submissions.category,
        solutionText: submissions.solutionText,
        structuredJson: submissions.structuredJson,
        subScores: submissions.subScores,
        evaluationNotes: submissions.evaluationNotes,
        createdAt: submissions.createdAt,
        name: sql<string>`${participants.firstName} || ' ' || ${participants.lastName}`,
      })
      .from(submissions)
      .innerJoin(participants, eq(submissions.participantId, participants.id))
      .orderBy(desc(submissions.totalScore), submissions.createdAt)
      .limit(limit);
    
    // Parse JSON strings for each result
    return results.map(result => ({
      ...result,
      subScores: typeof result.subScores === 'string' ? JSON.parse(result.subScores) : result.subScores,
      structuredJson: typeof result.structuredJson === 'string' ? JSON.parse(result.structuredJson) : result.structuredJson
    }));
  },

  async getWordCloudData(): Promise<{ text: string; value: number }[]> {
    const allSubmissions = await db.select().from(submissions);
    
    // Track both frequency and proper casing
    const wordData: { 
      [lowerKey: string]: { 
        count: number; 
        variants: { [casing: string]: number };
        properCase?: string;
      } 
    } = {};

    // Define proper casing for known Cisco products
    const properCasing: { [lower: string]: string } = {
      'appdynamics': 'AppDynamics',
      'thousandeyes': 'ThousandEyes',
      'webex': 'Webex',
      'meraki': 'Meraki',
      'securex': 'SecureX',
      'aci': 'Cisco ACI',
      'nexus': 'Nexus',
      'ucs': 'UCS',
      'sd-wan': 'SD-WAN',
      'zero trust': 'Zero Trust',
      'umbrella': 'Umbrella',
      'duo': 'Duo',
      'ise': 'ISE',
      'dna': 'DNA',
      'sase': 'SASE',
      'intersight': 'Intersight',
      'stealthwatch': 'Stealthwatch',
      'catalyst': 'Catalyst',
      'hyperflex': 'HyperFlex',
      'firepower': 'Firepower'
    };

    allSubmissions.forEach(submission => {
      // Extract Cisco products from structured JSON
      try {
        const structured = JSON.parse(submission.structuredJson);
        const products = structured.cisco_products || [];
        products.forEach((product: string) => {
          const cleanProduct = product.trim();
          const lowerKey = cleanProduct.toLowerCase();
          
          if (!wordData[lowerKey]) {
            wordData[lowerKey] = { count: 0, variants: {} };
          }
          
          wordData[lowerKey].count += 3; // Weight products higher
          wordData[lowerKey].variants[cleanProduct] = (wordData[lowerKey].variants[cleanProduct] || 0) + 1;
        });
      } catch (e) {
        // Fallback to solution text parsing
      }

      // Extract key technology terms from solution text (excluding generic "Cisco")
      const techTerms = submission.solutionText.match(/\b(Catalyst|ThousandEyes|AppDynamics|Webex|Meraki|SecureX|ACI|Nexus|UCS|SD-WAN|Zero Trust|Umbrella|Duo|ISE|DNA|SASE|Intersight|Stealthwatch|HyperFlex|Firepower)\b/gi) || [];
      techTerms.forEach((term: string) => {
        const cleanTerm = term.trim();
        const lowerKey = cleanTerm.toLowerCase();
        
        if (!wordData[lowerKey]) {
          wordData[lowerKey] = { count: 0, variants: {} };
        }
        
        wordData[lowerKey].count += 1;
        wordData[lowerKey].variants[cleanTerm] = (wordData[lowerKey].variants[cleanTerm] || 0) + 1;
      });
    });

    // Determine the best casing for each word
    Object.keys(wordData).forEach(lowerKey => {
      const data = wordData[lowerKey];
      
      // Check if we have a known proper casing
      if (properCasing[lowerKey]) {
        data.properCase = properCasing[lowerKey];
      } else {
        // Use the most frequent variant
        const mostFrequent = Object.entries(data.variants)
          .sort((a, b) => b[1] - a[1])[0];
        
        if (mostFrequent) {
          data.properCase = mostFrequent[0];
        } else {
          // Fallback: capitalize first letter
          data.properCase = lowerKey.charAt(0).toUpperCase() + lowerKey.slice(1);
        }
      }
    });

    return Object.entries(wordData)
      .filter(([lowerKey]) => lowerKey !== 'cisco') // Exclude generic "Cisco" term
      .map(([lowerKey, data]) => ({ 
        text: data.properCase || lowerKey, 
        value: data.count 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 30); // Top 30 terms
  },

  async getCategoryStats(): Promise<{ [key: string]: number }> {
    const results = await db
      .select({
        category: submissions.category,
        count: sql<number>`count(*)::int`,
      })
      .from(submissions)
      .groupBy(submissions.category);
    
    const stats: { [key: string]: number } = {};
    results.forEach(row => {
      stats[row.category] = row.count;
    });
    
    return stats;
  },

  async getData3Stats(category?: string): Promise<Data3Stat[]> {
    const query = db.select().from(data3Stats).orderBy(data3Stats.displayOrder);
    
    if (category) {
      return await query.where(eq(data3Stats.category, category));
    }
    
    return await query;
  },

  async getRecentSubmission(): Promise<any> {
    const [result] = await db
      .select({
        id: submissions.id,
        participantId: submissions.participantId,
        category: submissions.category,
        solutionText: submissions.solutionText,
        structuredJson: submissions.structuredJson,
        subScores: submissions.subScores,
        totalScore: submissions.totalScore,
        evaluationNotes: submissions.evaluationNotes,
        createdAt: submissions.createdAt,
        name: sql<string>`${participants.firstName} || ' ' || substr(${participants.lastName}, 1, 1) || '.'`,
      })
      .from(submissions)
      .innerJoin(participants, eq(submissions.participantId, participants.id))
      .orderBy(desc(submissions.createdAt))
      .limit(1);
    
    if (!result) return null;
    
    // Parse JSON strings for subScores and structuredJson
    return {
      ...result,
      subScores: typeof result.subScores === 'string' ? JSON.parse(result.subScores) : result.subScores,
      structuredJson: typeof result.structuredJson === 'string' ? JSON.parse(result.structuredJson) : result.structuredJson
    };
  },

  async getTopProblemCategory(): Promise<string> {
    const [result] = await db
      .select({
        category: submissions.category,
        count: sql<number>`count(*)::int`,
      })
      .from(submissions)
      .groupBy(submissions.category)
      .orderBy(desc(sql`count(*)`))
      .limit(1);
    
    return result?.category || "SECURE_CONNECTIVITY";
  },

  async clearDatabase(): Promise<void> {
    await db.delete(submissions);
    await db.delete(participants);
    // Don't clear data3_stats as they are reference data
  },

  async getSubmissionDetails(id: string): Promise<any> {
    return await this.getSubmission(id);
  },

  async getDetailedLeaderboard(limit: number = 100): Promise<any[]> {
    return await this.getAdminLeaderboard(limit);
  },

  async deleteSubmission(id: string): Promise<void> {
    await db.delete(submissions).where(eq(submissions.id, id));
  },

  async updateData3Stat(id: string, data: Partial<Data3Stat>): Promise<void> {
    await db.update(data3Stats).set(data).where(eq(data3Stats.id, id));
  },

  async createData3Stat(data: Omit<Data3Stat, 'id' | 'createdAt'>): Promise<Data3Stat> {
    const [result] = await db.insert(data3Stats).values(data).returning();
    return result;
  },

  async deleteData3Stat(id: string): Promise<void> {
    await db.delete(data3Stats).where(eq(data3Stats.id, id));
  },

  async getCategories(): Promise<any[]> {
    // System categories that are always present and protected
    const systemCategories = [
      { id: 'GENERAL', name: 'GENERAL', displayName: 'General', color: 'bg-[#64748b]', isSystemCategory: true },
      { id: 'SCALE', name: 'SCALE', displayName: 'Scale', color: 'bg-[#0891b2]', isSystemCategory: true },
      { id: 'EXPERTISE', name: 'EXPERTISE', displayName: 'Expertise', color: 'bg-[#059669]', isSystemCategory: true },
      { id: 'SECURE_CONNECTIVITY', name: 'SECURE_CONNECTIVITY', displayName: 'Zero Trust & Secure Connectivity', color: 'bg-[#00BCF2]', isSystemCategory: true },
      { id: 'HYBRID_DC', name: 'HYBRID_DC', displayName: 'Data Centre & Hybrid Cloud', color: 'bg-[#6CC04A]', isSystemCategory: true },
      { id: 'COLLAB_CX', name: 'COLLAB_CX', displayName: 'Collaboration & Contact Centre', color: 'bg-[#FF6B35]', isSystemCategory: true },
      { id: 'OBSERVABILITY', name: 'OBSERVABILITY', displayName: 'Observability & Performance', color: 'bg-[#9B59B6]', isSystemCategory: true },
      { id: 'EDGE_IOT', name: 'EDGE_IOT', displayName: 'Edge & IoT Solutions', color: 'bg-[#F39C12]', isSystemCategory: true }
    ];
    
    // Get custom categories from database
    const customCategoriesFromDb = await db.select().from(customCategories);
    
    // Defensive deduplication: Filter out any custom categories that collide with system categories
    // This handles the case where bad data might already exist in the database
    const systemCategoryNamesLower = SYSTEM_CATEGORY_NAMES.map(name => name.toLowerCase());
    const filteredCustomCategories = customCategoriesFromDb.filter(cat => {
      const categoryNameLower = cat.name.toLowerCase();
      const isCollision = systemCategoryNamesLower.includes(categoryNameLower);
      if (isCollision) {
        console.warn(`Filtering out custom category '${cat.name}' that collides with system category`);
      }
      return !isCollision;
    });
    
    // Transform custom categories to match the expected format
    const customCategoriesList = filteredCustomCategories.map(cat => ({
      id: cat.name, // Use name as ID for compatibility
      name: cat.name,
      displayName: cat.displayName,
      color: cat.color,
      isSystemCategory: false,
      createdAt: cat.createdAt?.toISOString()
    }));
    
    // Merge system and custom categories
    return [...systemCategories, ...customCategoriesList];
  },

  async createCategory(data: { name: string; displayName: string; color: string }): Promise<any> {
    // Check if the name collides with a system category (case-insensitive)
    const normalizedName = data.name.toUpperCase();
    if (SYSTEM_CATEGORY_NAMES.includes(normalizedName as any)) {
      throw new Error(`Cannot create category '${data.name}': This name is reserved for system categories. Please choose a different name.`);
    }
    
    // Also check case-insensitive against all system names
    const nameLower = data.name.toLowerCase();
    const systemNameLower = SYSTEM_CATEGORY_NAMES.find(sysName => sysName.toLowerCase() === nameLower);
    if (systemNameLower) {
      throw new Error(`Cannot create category '${data.name}': This name is too similar to the system category '${systemNameLower}'. Please choose a different name.`);
    }
    
    // Check if category with same name already exists
    const existing = await db.select().from(customCategories).where(eq(customCategories.name, data.name));
    if (existing.length > 0) {
      throw new Error(`Category with name '${data.name}' already exists`);
    }
    
    // Insert new custom category
    const [result] = await db.insert(customCategories).values({
      name: data.name,
      displayName: data.displayName,
      color: data.color
    }).returning();
    
    return {
      id: result.name,
      name: result.name,
      displayName: result.displayName,
      color: result.color,
      isSystemCategory: false,
      createdAt: result.createdAt?.toISOString()
    };
  },

  async updateCategory(id: string, data: { displayName: string; color: string }): Promise<void> {
    // Only allow updating custom categories (not system categories)
    const category = await db.select().from(customCategories).where(eq(customCategories.name, id));
    
    if (category.length === 0) {
      throw new Error(`Custom category '${id}' not found or is a system category`);
    }
    
    await db.update(customCategories)
      .set({
        displayName: data.displayName,
        color: data.color
      })
      .where(eq(customCategories.name, id));
  },

  async deleteCategory(id: string): Promise<{ success: boolean; reassignedStats?: number }> {
    // Check if it's a custom category (not a system category)
    const category = await db.select().from(customCategories).where(eq(customCategories.name, id));
    
    if (category.length === 0) {
      throw new Error(`Custom category '${id}' not found or is a system category`);
    }
    
    // Find all stats using this category
    const stats = await db.select().from(data3Stats).where(eq(data3Stats.category, id));
    
    // Reassign stats to GENERAL category
    if (stats.length > 0) {
      await db.update(data3Stats)
        .set({ category: 'GENERAL' })
        .where(eq(data3Stats.category, id));
    }
    
    // Delete the custom category
    await db.delete(customCategories).where(eq(customCategories.name, id));
    
    return { 
      success: true, 
      reassignedStats: stats.length 
    };
  }
};