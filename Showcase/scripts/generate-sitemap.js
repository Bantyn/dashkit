const fs = require('fs');
const path = require('path');

const domain = 'https://clothify.co';

const routes = [
  { path: '', changefreq: 'daily', priority: '1.0' },
  { path: 'whats-new', changefreq: 'weekly', priority: '0.8' },
  { path: 'blogs', changefreq: 'daily', priority: '0.8' },
  { path: 'about', changefreq: 'monthly', priority: '0.6' },
  { path: 'contact-us', changefreq: 'monthly', priority: '0.6' },
  { path: 'pricing', changefreq: 'weekly', priority: '0.8' },
  { path: 'how-to-install', changefreq: 'weekly', priority: '0.7' },
  { path: 'billing-and-pos', changefreq: 'weekly', priority: '0.8' },
  { path: 'staff-management', changefreq: 'weekly', priority: '0.8' },
  { path: 'inventory-tracker', changefreq: 'weekly', priority: '0.8' },
  { path: 'customer-crm', changefreq: 'weekly', priority: '0.8' },
  { path: 'reports-analytics', changefreq: 'weekly', priority: '0.8' },
  { path: 'website-builder', changefreq: 'weekly', priority: '0.8' },
  { path: 'multi-branch', changefreq: 'weekly', priority: '0.8' }
];

const generateSitemap = () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url>
    <loc>${domain}/${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`Sitemap successfully generated at: ${outputPath}`);
};

generateSitemap();
