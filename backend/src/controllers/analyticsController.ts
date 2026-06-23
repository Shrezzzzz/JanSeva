import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateInsights } from '../services/groqService';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

export async function getSummary(req: Request, res: Response) {
  try {
    const range = (req.query.range as string) ?? '30d';
    const days  = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[range] ?? 30;
    const since = subDays(new Date(), days);

    const [total, resolved, issues] = await Promise.all([
      prisma.issue.count({ where: { createdAt: { gte: since } } }),
      prisma.issue.count({ where: { createdAt: { gte: since }, status: { in: ['Resolved', 'Closed'] } } }),
      prisma.issue.findMany({
        where: { createdAt: { gte: since } },
        select: { category: true, status: true, zone: true, createdAt: true, updatedAt: true },
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

    const activeContributors = await prisma.user.count({ where: { updatedAt: { gte: since } } });

    return res.json({
      success: true,
      data: { totalIssues: total, resolvedIssues: resolved, resolutionRate, avgResolutionDays: +avgDays.toFixed(1), activeContributors, trends, byCategory, byZone },
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Analytics query failed' });
  }
}

export async function getAIInsights(req: Request, res: Response) {
  try {
    // Build a JSON summary for Groq
    const stats = await prisma.issue.groupBy({
      by: ['category', 'status'],
      _count: { _all: true },
    });
    const insights = await generateInsights(JSON.stringify(stats));
    return res.json({ success: true, data: { insights } });
  } catch {
    return res.status(500).json({ success: false, error: 'Insight generation failed' });
  }
}

export async function getLeaderboard(req: Request, res: Response) {
  try {
    const ward = (req.query.ward as string | undefined)?.trim() || undefined;

    const users = await prisma.user.findMany({
      where: { role: 'Citizen', ...(ward ? { ward } : {}) },
      orderBy: { xp: 'desc' },
      take: 10,
      select: {
        id: true, citizenId: true, name: true, ward: true, xp: true, level: true, badges: true,
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
      name: u.name,
      ward: u.ward,
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
