import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateInsights } from '../services/groqService';
import { subDays } from 'date-fns';
import { generateGeminiJSON } from '../ai/gemini/client';
import { nowIso } from '../ai/utils/json';
import { getAuthorityWhereClause } from '../services/authorityAssignmentService';
import type { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

type AIInsight = {
  title: string;
  description: string;
  icon: string;
  priority: 'High' | 'Medium' | 'Low';
};

export async function getSummary(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.userId
      ? await prisma.user.findUnique({
          where: { id: authReq.userId },
          select: { email: true, role: true, ward: true },
        })
      : null;

    const range = (req.query.range as string) ?? '30d';
    const days  = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[range] ?? 30;
    const since = subDays(new Date(), days);

    const authorityWhere =
    user && user.role === 'Admin'
      ? getAuthorityWhereClause(user)
      : {};

    const [total, active, resolved, issues] = await Promise.all([
      prisma.issue.count({ where: { createdAt: { gte: since }, ...authorityWhere } }),
      prisma.issue.count({
        where: {
          createdAt: { gte: since },
          status: { notIn: ['Resolved', 'Closed'] },
          ...authorityWhere,
        },
      }),
      prisma.issue.count({ where: { createdAt: { gte: since }, status: { in: ['Resolved', 'Closed'] }, ...authorityWhere } }),
      prisma.issue.findMany({
        where: { createdAt: { gte: since }, ...authorityWhere },
        select: { category: true, severity: true, status: true, zone: true, createdAt: true, updatedAt: true },
      }),
    ]);

    const resolutionRate = total > 0 ? resolved / total : 0;

    // Avg resolution days (rough — updatedAt - createdAt for resolved issues)
    const resolvedIssues = issues.filter((i) => ['Resolved', 'Closed'].includes(i.status));
    const avgDays = resolvedIssues.length
      ? resolvedIssues.reduce((sum, i) => sum + (i.updatedAt.getTime() - i.createdAt.getTime()) / 86400000, 0) / resolvedIssues.length
      : 0;

    // Trend: last `days` buckets grouped by day
    const trendMap: Record<string, { issues: number; resolved: number }> = {};
    for (let d = days - 1; d >= 0; d--) {
      const key = subDays(new Date(), d).toISOString().split('T')[0];
      trendMap[key] = { issues: 0, resolved: 0 };
    }
    for (const i of issues) {
      const key = i.createdAt.toISOString().split('T')[0];
      if (trendMap[key]) {
        trendMap[key].issues += 1;
        if (['Resolved', 'Closed'].includes(i.status)) trendMap[key].resolved += 1;
      }
    }

    const trends = {
      issues:   Object.entries(trendMap).map(([date, v]) => ({ date, count: v.issues })),
      resolved: Object.entries(trendMap).map(([date, v]) => ({ date, count: v.resolved })),
    };

    // By category
    const catCount: Record<string, { count: number; resolved: number }> = {};
    for (const i of issues) {
      if (!catCount[i.category]) catCount[i.category] = { count: 0, resolved: 0 };
      catCount[i.category].count += 1;
      if (['Resolved', 'Closed'].includes(i.status)) catCount[i.category].resolved += 1;
    }
    const CAT_COLORS: Record<string, string> = {
      Pothole: '#DC2626', Streetlight: '#F59E0B', WaterLeak: '#0284C7',
      WasteDump: '#65A30D', Sewage: '#7C3AED', RoadDamage: '#EA580C',
      ParkIssue: '#16A34A', Other: '#6F6F6F',
    };
    const byCategory = Object.entries(catCount).map(([category, v]) => ({
      category, ...v, color: CAT_COLORS[category] ?? '#6F6F6F',
    }));

    const severityCount: Record<string, number> = {};
    for (const i of issues) {
      severityCount[i.severity] = (severityCount[i.severity] ?? 0) + 1;
    }
    const severityDistribution = Object.entries(severityCount).map(([severity, count]) => ({
      severity,
      count,
    }));

    // By zone
    const zoneMap: Record<string, { reported: number; resolved: number; totalDays: number }> = {};
    for (const i of issues) {
      const z = i.zone ?? 'Unknown';
      if (!zoneMap[z]) zoneMap[z] = { reported: 0, resolved: 0, totalDays: 0 };
      zoneMap[z].reported += 1;
      if (['Resolved', 'Closed'].includes(i.status)) {
        zoneMap[z].resolved += 1;
        zoneMap[z].totalDays += (i.updatedAt.getTime() - i.createdAt.getTime()) / 86400000;
      }
    }
    const byZone = Object.entries(zoneMap).map(([zone, v]) => {
      const rate = v.reported > 0 ? v.resolved / v.reported : 0;
      const avg  = v.resolved > 0 ? v.totalDays / v.resolved : 0;
      const grade = rate >= 0.85 ? 'A' : rate >= 0.70 ? 'B' : rate >= 0.55 ? 'C' : 'D';
      return { zone, reported: v.reported, resolved: v.resolved, avgDays: +avg.toFixed(1), responseRate: +rate.toFixed(2), grade } as const;
    });

    const activeContributors = await prisma.issue.findMany({
      where: { createdAt: { gte: since }, reporterId: { not: null }, isAnonymous: false },
      distinct: ['reporterId'],
      select: { reporterId: true },
    }).then((rows) => rows.length);

    return res.json({
      success: true,
      data: {
        totalIssues: total,
        activeIssues: active,
        resolvedIssues: resolved,
        resolutionRate,
        avgResolutionDays: +avgDays.toFixed(1),
        activeContributors,
        trends,
        byCategory,
        severityDistribution,
        byZone,
        wardDistribution: byZone,
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Analytics query failed' });
  }
}

export async function getAIInsights(req: Request, res: Response) {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.userId
      ? await prisma.user.findUnique({
          where: { id: authReq.userId },
          select: { email: true, role: true, ward: true },
        })
      : null;

    const authorityWhere =
    user && user.role === 'Admin'
      ? getAuthorityWhereClause(user)
      : {};

    const since7 = subDays(new Date(), 7);
    const since30 = subDays(new Date(), 30);
    const since60 = subDays(new Date(), 60);

    const [categoryStatus, recentIssues, previousIssues, departmentStatus, zoneStatus, activeCitizens] = await Promise.all([
      prisma.issue.groupBy({ by: ['category', 'status'], _count: { _all: true }, where: authorityWhere }),
      prisma.issue.findMany({
        where: { createdAt: { gte: since30 }, ...authorityWhere },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: {
          title: true, category: true, status: true, severity: true, zone: true, department: true,
          priorityScore: true, createdAt: true, updatedAt: true,
        },
      }),
      prisma.issue.findMany({
        where: { createdAt: { gte: since60, lt: since30 }, ...authorityWhere },
        select: { category: true, zone: true, createdAt: true },
      }),
      prisma.issue.groupBy({ by: ['department', 'status'], _count: { _all: true }, where: authorityWhere }),
      prisma.issue.groupBy({ by: ['zone', 'category'], _count: { _all: true }, where: authorityWhere }),
      prisma.issue.findMany({
        where: { createdAt: { gte: since30 }, reporterId: { not: null }, isAnonymous: false, ...authorityWhere },
        distinct: ['reporterId'],
        select: { reporterId: true },
      }),
    ]);

    const fallback: AIInsight[] = [
      {
        title: 'Top civic pressure',
        description: categoryStatus.length
          ? `Current city load is led by ${categoryStatus.sort((a, b) => b._count._all - a._count._all)[0].category}. Prioritize field verification in the busiest wards.`
          : 'No category pressure is visible yet. Keep monitoring new reports as citizens submit issues.',
        icon: '📊',
        priority: 'Medium',
      },
      {
        title: 'Emerging hotspots',
        description: zoneStatus.length
          ? `${zoneStatus.sort((a, b) => b._count._all - a._count._all)[0].zone || 'Unassigned areas'} has the highest repeated report density.`
          : 'Hotspot detection will improve as more geotagged reports arrive.',
        icon: '📍',
        priority: 'High',
      },
      {
        title: 'Citizen participation',
        description: `${activeCitizens.length} active citizen${activeCitizens.length === 1 ? '' : 's'} reported issues in the last 30 days.`,
        icon: '👥',
        priority: 'Low',
      },
    ];

    const stats = {
      generatedAt: nowIso(),
      windows: { last7Days: since7, last30Days: since30, previous30Days: since60 },
      categoryStatus,
      recentIssues,
      previousIssues,
      departmentStatus,
      zoneStatus,
      activeCitizens: activeCitizens.length,
    };

    const prompt = `
You are JanSeva Gemini Civic Intelligence, a city analytics advisor for municipal operations.
Return ONLY JSON in this shape:
{ "insights": [{ "title": string, "description": string, "icon": string, "priority": "High"|"Medium"|"Low" }] }

Generate 6 concise, useful insights covering:
- top issue categories
- fastest growing issue type
- emerging hotspots
- weekly/monthly trends
- department performance
- predicted future issue clusters
- resolution performance
- citizen participation growth

Use the provided city-wide data only. Avoid generic filler.
Stats:
${JSON.stringify(stats)}
`.trim();

    let insights: AIInsight[] | undefined;
    try {
      insights = (await generateGeminiJSON<{ insights: AIInsight[] }>(
        prompt,
        { insights: fallback },
        { timeoutMs: 12000 },
      )).insights;
    } catch (geminiErr) {
      console.error('Gemini insight generation failed, falling back to Groq:', geminiErr);
    }
    if (!insights?.length && process.env.GROQ_API_KEY) {
      try {
        insights = await generateInsights(JSON.stringify(stats)) as AIInsight[];
      } catch (groqErr) {
        console.error('Groq insight generation failed, using static fallback:', groqErr);
      }
    }
    insights = insights?.length ? insights : fallback;
    return res.json({ success: true, data: { insights } });
  } catch (e) {
    console.error('getAIInsights failed:', e);
    return res.status(500).json({ success: false, error: 'Could not generate insights right now. Please try again.' });
  }
}
export async function getLeaderboard(req: Request, res: Response) {
  try {
    const ward = (req.query.ward as string | undefined)?.trim() || undefined;

    const users = await prisma.user.findMany({
      where: {
        role: 'Citizen',
        ...(ward ? { ward } : {}),
      },
      orderBy: { xp: 'desc' },
      take: 10,
      select: {
        id: true, citizenId: true, name: true, ward: true, avatarUrl: true,
        activeCharacter: true, xp: true, level: true, badges: true,
        _count: { select: { issues: true } },
      },
    });

    const resolvedCounts = await Promise.all(
      users.map((u) =>
        prisma.issue.count({ where: { reporterId: u.id, status: { in: ['Resolved', 'Closed'] } } }),
      ),
    );

    const entries = users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      citizenId: u.citizenId,
      name: u.name.trim() || 'Anonymous Citizen',
      ward: u.ward,
      avatarUrl: u.avatarUrl,
      activeCharacter: u.activeCharacter,
      xp: u.xp,
      topBadge: u.badges[0] ? { id: u.badges[0], name: u.badges[0], icon: '🏅', description: '', locked: false } : null,
      issuesReported: u._count.issues,
      issuesResolved: resolvedCounts[i],
    }));
    return res.json({ success: true, data: entries });
  } catch {
    return res.status(500).json({ success: false, error: 'Leaderboard query failed' });
  }
}
