// Fetches businesses for a metro+category that have a website (needed for
// pricing research) and writes them as numbered "Name | slug | website"
// chunk .txt files, matching the format the pricing-research agents expect.
// Usage: node chunk-for-pricing.cjs <metro-slug> <category> <out-dir> <chunk-size>
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envText = fs.readFileSync('C:/github/nairbinod/wellness-ai/.env.local', 'utf8');
const env = Object.fromEntries(
  envText.split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1).trim()];
  })
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const [metroSlug, category, outDir, chunkSizeArg] = process.argv.slice(2);
  const chunkSize = parseInt(chunkSizeArg || '24', 10);

  const { data: metro } = await supabase.from('metros').select('id').eq('slug', metroSlug).maybeSingle();
  if (!metro) throw new Error(`no metro ${metroSlug}`);

  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('name, slug, website')
    .eq('metro_id', metro.id)
    .eq('category', category)
    .not('website', 'is', null)
    .order('name');
  if (error) throw new Error(error.message);

  const lines = businesses.map((b) => `${b.name} | ${b.slug} | ${b.website}`);
  const chunks = [];
  for (let i = 0; i < lines.length; i += chunkSize) chunks.push(lines.slice(i, i + chunkSize));

  chunks.forEach((chunk, i) => {
    const filePath = path.join(outDir, `${metroSlug}-${category}-chunk-${i + 1}.txt`);
    fs.writeFileSync(filePath, chunk.map((l, j) => `${j + 1}. ${l}`).join('\n') + '\n');
  });

  console.log(`${metroSlug}/${category}: ${businesses.length} businesses with a website -> ${chunks.length} chunks`);
}

main().catch((err) => { console.error(err); process.exit(1); });
