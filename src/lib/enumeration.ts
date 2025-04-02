import axios from "axios";

// Get API keys from environment variables
const API_KEYS = {
  BEVIGIL: process.env.NEXT_PUBLIC_BEVIGIL_API_KEY,
  BINARYEDGE: process.env.NEXT_PUBLIC_BINARYEDGE_API_KEY,
  BUILTWITH: process.env.NEXT_PUBLIC_BUILTWITH_API_KEY,
  CENSYS_ID: process.env.NEXT_PUBLIC_CENSYS_API_ID,
  CENSYS_SECRET: process.env.NEXT_PUBLIC_CENSYS_API_SECRET,
  CERTSPOTTER: process.env.NEXT_PUBLIC_CERTSPOTTER_API_KEY,
  CHAOS: process.env.NEXT_PUBLIC_CHAOS_API_KEY,
  FOFA: process.env.NEXT_PUBLIC_FOFA_API_KEY,
  FULLHUNT: process.env.NEXT_PUBLIC_FULLHUNT_API_KEY,
  GITHUB: process.env.NEXT_PUBLIC_GITHUB_API_KEY,
  INTELX: process.env.NEXT_PUBLIC_INTELX_API_KEY,
  LEAKIX: process.env.NEXT_PUBLIC_LEAKIX_API_KEY,
  NETLAS: process.env.NEXT_PUBLIC_NETLAS_API_KEY,
  SECURITYTRAILS: process.env.NEXT_PUBLIC_SECURITYTRAILS_API_KEY,
  SHODAN: process.env.NEXT_PUBLIC_SHODAN_API_KEY,
};

const API_SOURCES = [
  { name: "securitytrails", handler: fetchFromSecurityTrails },
  { name: "censys", handler: fetchFromCensys },
  { name: "certspotter", handler: fetchFromCertSpotter },
  { name: "binaryedge", handler: fetchFromBinaryEdge },
  { name: "builtwith", handler: fetchFromBuiltWith },
  { name: "fofa", handler: fetchFromFofa },
  { name: "fullhunt", handler: fetchFromFullHunt },
  { name: "github", handler: fetchFromGithub },
  { name: "intelx", handler: fetchFromIntelX },
  { name: "leakix", handler: fetchFromLeakIX },
  { name: "netlas", handler: fetchFromNetlas },
  { name: "bevigil", handler: fetchFromBeVigil },
  { name: "chaos", handler: fetchFromChaos },
  { name: "shodan", handler: fetchFromShodan },
  { name: "crtsh", handler: fetchFromCrtSh },
];

// Main enumeration function that processes APIs in chunks
export async function enumerateSubdomains(
  domain: string,
  startFrom: number = 0,
  chunkSize: number = 5
) {
  const results: string[] = [];
  const endAt = Math.min(startFrom + chunkSize, API_SOURCES.length);
  
  // Process only a chunk of APIs
  for (let i = startFrom; i < endAt; i++) {
    try {
      const source = API_SOURCES[i];
      console.log(`Fetching from ${source.name} for ${domain}`);
      
      const sourceResults = await source.handler(domain);
      if (sourceResults && sourceResults.length) {
        results.push(...sourceResults);
      }
    } catch (error) {
      console.error(`Error fetching from source ${i}:`, error);
      // Continue with other sources even if one fails
    }
  }
  
  // Deduplicate results
  const uniqueSubdomains = [...new Set(results)];
  
  return {
    subdomains: uniqueSubdomains,
    completedApis: endAt,
  };
}

// Implementation of individual API handlers
async function fetchFromSecurityTrails(domain: string) {
  if (!API_KEYS.SECURITYTRAILS) return [];
  
  try {
    const response = await axios.get(
      `https://api.securitytrails.com/v1/domain/${domain}/subdomains`,
      {
        headers: {
          'APIKEY': API_KEYS.SECURITYTRAILS,
        },
        timeout: 10000,
      }
    );
    
    if (response.data && response.data.subdomains) {
      return response.data.subdomains.map(sub => `${sub}.${domain}`);
    }
    return [];
  } catch (error) {
    console.error("SecurityTrails API error:", error.message);
    return [];
  }
}

// Implement other API handlers similarly
async function fetchFromCensys(domain: string) {
  if (!API_KEYS.CENSYS_ID || !API_KEYS.CENSYS_SECRET) return [];
  
  try {
    const response = await axios.get(
      `https://search.censys.io/api/v1/search/certificates`,
      {
        params: {
          q: `parsed.names: ${domain}`,
          fields: ['parsed.names'],
          per_page: 100,
        },
        auth: {
          username: API_KEYS.CENSYS_ID,
          password: API_KEYS.CENSYS_SECRET,
        },
        timeout: 10000,
      }
    );
    
    const subdomains = [];
    if (response.data && response.data.results) {
      response.data.results.forEach(result => {
        if (result.parsed && result.parsed.names) {
          result.parsed.names.forEach(name => {
            if (name.endsWith(domain) && name !== domain) {
              subdomains.push(name);
            }
          });
        }
      });
    }
    
    return subdomains;
  } catch (error) {
    console.error("Censys API error:", error.message);
    return [];
  }
}

// Implement other API functions similarly
// ...

// Simple function to fetch from Certificate Transparency logs (crt.sh)
async function fetchFromCrtSh(domain: string) {
  try {
    const response = await axios.get(
      `https://crt.sh/?q=${domain}&output=json`,
      { timeout: 10000 }
    );
    
    const subdomains = [];
    if (response.data) {
      response.data.forEach(cert => {
        if (cert.name_value) {
          cert.name_value.split('\n').forEach(name => {
            if (name.endsWith(domain) && name !== domain) {
              subdomains.push(name);
            }
          });
        }
      });
    }
    
    return subdomains;
  } catch (error) {
    console.error("crt.sh API error:", error.message);
    return [];
  }
}

// Continue implementing other API functions...
// For brevity, I'm not including all implementations, but you would need to implement each one 