
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Subdomain from '@/models/Subdomain';
import Vulnerability from '@/models/Vulnerability';
import { IVulnerability } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    // Get all subdomains for the project
    const subdomains = await Subdomain.find({ projectId: params.id });
    const subdomainIds = subdomains.map(s => s._id);
    
    // Get all vulnerabilities grouped by subdomain
    const vulnerabilities = await Vulnerability.find({
      subdomainId: { $in: subdomainIds }
    });

    // Group vulnerabilities by subdomain
    const vulnerabilitiesBySubdomain = vulnerabilities.reduce<Record<string, IVulnerability[]>>((acc, vuln) => {
      const subdomainId = vuln.subdomainId.toString();
      if (!acc[subdomainId]) {
        acc[subdomainId] = [];
      }
      acc[subdomainId].push(vuln);
      return acc;
    }, {});

    // Count pending subdomains (where all vulnerabilities are "Not Yet Done")
    let pendingCount = 0;
    let foundCount = 0;
    let notFoundCount = 0;

    Object.values(vulnerabilitiesBySubdomain).forEach((subdomainVulns) => {
      const allNotYetDone = subdomainVulns.every(v => v.status === 'Not Yet Done');
      if (allNotYetDone) {
        pendingCount++;
      }
      
      // Count vulnerabilities
      const foundVulns = subdomainVulns.filter(v => v.status === 'Found').length;
      const notFoundVulns = subdomainVulns.filter(v => v.status === 'Not Found').length;
      foundCount += foundVulns;
      notFoundCount += notFoundVulns;
    });

    const stats = {
      subdomainCount: subdomains.length,
      completedCount: subdomains.filter(s => s.status === 'completed').length,
      vulnerabilityStats: {
        found: foundCount,
        notFound: notFoundCount,
        notDone: pendingCount
      }
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project stats' }, 
      { status: 500 }
    );
  }
} 