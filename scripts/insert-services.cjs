// Reusable inserter for agent-researched pricing. Usage: node insert-services.js <path-to-json>
// JSON shape: [{ slug, services: [{ name, price_min, price_max, duration_minutes, description }] }]
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'github', 'nairbinod', 'wellness-ai', '.env.local');
const envText = fs.readFileSync('C:/github/nairbinod/wellness-ai/.env.local', 'utf8');
const env = Object.fromEntries(
  envText.split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1).trim()];
  })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const inputPath = process.argv[2];
  const batch = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  let totalInserted = 0;
  for (const entry of batch) {
    const { data: business, error: lookupError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('slug', entry.slug)
      .maybeSingle();

    if (lookupError || !business) {
      console.error(`! no business found for slug ${entry.slug}`);
      continue;
    }

    const rows = entry.services.map(s => ({
      business_id: business.id,
      name: s.name,
      category: s.category ?? null,
      price_min: s.price_min ?? null,
      price_max: s.price_max ?? s.price_min ?? null,
      duration_minutes: s.duration_minutes ?? null,
      description: s.description ?? null,
    }));

    const { error: insertError } = await supabase.from('services').insert(rows);
    if (insertError) {
      console.error(`! insert failed for ${entry.slug}: ${insertError.message}`);
      continue;
    }
    console.log(`+ ${business.name} (${entry.slug}): ${rows.length} services`);
    totalInserted += rows.length;
  }

  console.log(`\nDone. ${totalInserted} services inserted.`);
}

main();
