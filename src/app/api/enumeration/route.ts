import { NextResponse } from 'next/server';
import { enumerationConfig } from '@/config/enumeration-config';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import Subdomain from '@/models/Subdomain';
import Vulnerability from '@/models/Vulnerability';
import { vulnerabilityTypes } from '@/constants/vulnerabilityTypes';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

async function fetchSubdomainsFromCertspotter(domain: string) {
  try {
    const response = await fetch(
      `https://api.certspotter.com/v1/issuances?domain=${domain}&include_subdomains=true&expand=dns_names`,
      {
        headers: {
          Authorization: `Bearer ${enumerationConfig.certspotter}`
        }
      }
    );
    const data = await response.json();
    const subdomains = new Set<string>();
    
    data.forEach((cert: any) => {
      cert.dns_names.forEach((name: string) => {
        if (name.endsWith(domain)) {
          subdomains.add(name);
        }
      });
    });
    
    return Array.from(subdomains);
  } catch (error) {
    console.error('Error fetching from Certspotter:', error);
    return [];
  }
}

async function fetchSubdomainsFromCensys(domain: string) {
  try {
    const auth = Buffer.from(
      `${enumerationConfig.censys.id}:${enumerationConfig.censys.secret}`
    ).toString('base64');
    
    const response = await fetch(
      `https://search.censys.io/api/v2/certificates/search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `parsed.names: ${domain}`,
          per_page: 100
        })
      }
    );
    
    const data = await response.json();
    const subdomains = new Set<string>();
    
    data.result.hits.forEach((hit: any) => {
      hit.parsed.names.forEach((name: string) => {
        if (name.endsWith(domain)) {
          subdomains.add(name);
        }
      });
    });
    
    return Array.from(subdomains);
  } catch (error) {
    console.error('Error fetching from Censys:', error);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { domain } = await request.json();
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Create new project
    const project = await Project.create({
      name: domain,
      mainDomain: domain,
      userId: session.user.id,
      status: 'active'
    });

    // Fetch subdomains from different sources
    const [certspotterSubdomains, censysSubdomains] = await Promise.all([
      fetchSubdomainsFromCertspotter(domain),
      fetchSubdomainsFromCensys(domain)
    ]);

    // Combine and deduplicate subdomains
    const allSubdomains = new Set([
      domain,
      ...certspotterSubdomains,
      ...censysSubdomains
    ]);

    // Create subdomains and vulnerabilities
    const createdSubdomains = [];
    for (const subdomain of allSubdomains) {
      const newSubdomain = await Subdomain.create({
        projectId: project._id,
        name: subdomain.trim(),
        status: 'scanning'
      });

      // Create vulnerabilities for each subdomain
      await Promise.all(vulnerabilityTypes.map(vulnType =>
        Vulnerability.create({
          subdomainId: newSubdomain._id,
          type: vulnType.type,
          severity: vulnType.severity,
          status: 'Not Yet Done'
        })
      ));

      createdSubdomains.push(newSubdomain);
    }

    return NextResponse.json({
      project,
      subdomainsCount: createdSubdomains.length,
      message: 'Enumeration completed successfully'
    });

  } catch (error: any) {
    console.error('Error during enumeration:', error);
    return NextResponse.json({
      error: 'Failed to complete enumeration',
      details: error.message
    }, { status: 500 });
  }
} 