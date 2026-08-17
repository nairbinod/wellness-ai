import type { BusinessCategory } from "@/lib/categories";

// Unique editorial content for each /[metro]/[category] page — added to fix
// a thin/near-duplicate-content risk: the base template renders identically
// across every metro×category combination with only names swapped, which
// search engines can treat as thin content even though the underlying
// listing data is real. Market-context paragraphs and neighborhood clusters
// below are derived from actual listing address data (city/suburb
// distribution and repeated street names), not generic filler. Regulatory
// notes are cross-referenced against primary/official sources (Texas TDLR,
// Georgia Board of Nursing position statement) — see conversation history
// for sourcing. This is general information, not legal or medical advice.

type MetroIntro = { paragraphs: string[] };
type RegulatoryNote = { heading: string; paragraphs: string[] };

export const METRO_CATEGORY_INTROS: Record<string, Partial<Record<BusinessCategory, MetroIntro>>> = {
  dallas: {
    med_spa: {
      paragraphs: [
        "Dallas has one of the largest med spa markets in Texas, with well over 250 active listings across the metro on PrimeNearby alone. The heaviest concentration sits inside Dallas proper along the Uptown and Oak Lawn corridors — McKinney Avenue and Oak Lawn Avenue alone carry a dense cluster of injectables and aesthetics practices — with smaller pockets in Lakewood and the Design District near downtown. Outside the core city, the market splits into distinct suburban hubs: Frisco and Plano each host more than 30 med spas, largely serving North Dallas's fast-growing, affluent suburbs, with a smaller but active cluster in McKinney further north and Irving to the west near DFW Airport.",
        "Competition is real in every one of these submarkets, which tends to push pricing into public view — a meaningful share of Dallas-area med spas on PrimeNearby publish real per-unit Botox and per-syringe filler pricing rather than routing every question to a consultation call. Between Uptown's boutique injectables studios and the larger suburban practices in Frisco and Plano, Dallas-area clients can generally choose between a walkable urban location and a suburban med spa with more parking and often lower price-per-unit rates outside the urban core.",
      ],
    },
    iv_therapy: {
      paragraphs: [
        "IV and infusion therapy has grown into a real category across Dallas–Fort Worth, with just over 110 active listings on PrimeNearby. Just under half sit inside Dallas proper, spread across the same Uptown and Oak Lawn corridor that anchors the med spa market, alongside a growing mobile-IV segment that serves the wider metro without a fixed storefront — several Dallas-based operators will drive to a home, office, or hotel rather than requiring an in-clinic visit. Frisco and Arlington are the two biggest suburban hubs: Frisco's cluster skews toward wellness-focused IV bars and NAD+ clinics serving North Dallas's fast-growing suburbs, while Arlington sits closer to the Mid-Cities corridor between Dallas and Fort Worth. Smaller pockets exist in Plano, Farmers Branch, and Allen.",
        "Pricing varies more here than in med spas — drip menus range from simple hydration bags to multi-additive NAD+ protocols — and a meaningful number of Dallas-area providers publish real per-drip pricing rather than requiring a phone call. Because IV hydration in Texas is a nursing act performed under a physician-approved protocol, not a walk-in retail product, it's worth knowing who's actually administering it and under whose oversight — more on that below.",
      ],
    },
    mens_health: {
      paragraphs: [
        "Men's health and TRT clinics are a growing category in Dallas–Fort Worth, with 121 active listings on PrimeNearby spanning everything from dedicated testosterone clinics to broader men's wellness practices that also treat ED and general hormone health. Dallas proper and Frisco carry the largest concentrations — Frisco in particular has become a hub for newer, purpose-built men's health clinics serving North Dallas's suburban growth corridor, while Dallas's cluster skews toward longer-established practices near the medical district and North Central Expressway. Plano, Irving, Richardson, and McKinney each host smaller but active clusters.",
        "Because testosterone is a federally controlled substance, every legitimate clinic in this list — regardless of city — operates under real prescribing requirements: lab-confirmed diagnosis, a documented in-person evaluation, and DEA-registered prescribing. That's not optional paperwork; it's the difference between a compliant clinic and one cutting corners, and it's covered in more detail in the section below.",
      ],
    },
  },
  austin: {
    med_spa: {
      paragraphs: [
        "Austin has the single largest med spa market in PrimeNearby's Phase 1 coverage, with 273 active listings across the metro. Inside Austin proper, the market clusters heavily along South Lamar and South Congress near Zilker and Bouldin Creek, with a second, denser pocket downtown and in Old West Austin along West 6th Street, and a third cluster to the west along Bee Caves Road serving the Westlake area. Outside the core city, Cedar Park and Round Rock are the two largest suburban hubs — both part of the fast-growing corridor north of Austin along US-183 and I-35 — with a smaller but real cluster further out in Georgetown and a handful of listings in San Marcos toward the San Antonio side of the metro.",
        "With this much density, comparison shopping is realistic: a meaningful share of Austin-area med spas publish real per-unit and per-syringe pricing rather than gating it behind a consultation, and the gap between an Austin-proper boutique studio and a Cedar Park or Round Rock suburban practice is often as much about price as it is about location.",
      ],
    },
    iv_therapy: {
      paragraphs: [
        "Austin's IV and infusion therapy scene includes 99 active listings on PrimeNearby, a little more than half of them inside Austin proper. The city's IV bars and mobile-IV operators cluster loosely around the same downtown and South Lamar corridors that anchor the med spa market, with several mobile operators covering the broader metro rather than working out of a single storefront. Round Rock is the largest suburban hub, followed by Georgetown and Pflugerville — all three sit along the northern growth corridor that's added significant population, and demand for wellness services, over the past several years. Smaller clusters exist in West Lake Hills, Bee Cave, and Cedar Park.",
        "As in the rest of Texas, IV hydration here is a nursing act performed under a physician-approved protocol rather than an unregulated retail service — worth understanding before booking, and covered in the section below.",
      ],
    },
    mens_health: {
      paragraphs: [
        "Men's health and TRT clinics in the Austin metro total 89 active listings on PrimeNearby, split fairly evenly between Austin proper and its northern suburbs. Round Rock has emerged as a particularly strong hub — nearly a quarter of the metro's listings are there, reflecting the same population growth that's driven Round Rock's broader healthcare expansion — with a smaller but active cluster in Pflugerville and Georgetown further up the same corridor. Inside Austin proper, listings skew toward the central and south-central parts of the city rather than one single strip.",
        "As with the rest of Texas, every legitimate testosterone clinic on this list is bound by the same federal and state prescribing rules regardless of which suburb it's in — lab-confirmed diagnosis, an in-person evaluation, and DEA-registered prescribing are the baseline, not optional extras. More detail on what that means in practice is below.",
      ],
    },
  },
  atlanta: {
    med_spa: {
      paragraphs: [
        "Atlanta has the largest med spa market of any metro on PrimeNearby, with 290 active listings. Inside the city, the heaviest concentration runs along the Buckhead corridor — Peachtree Road and Roswell Road alone account for a dense cluster of injectables and aesthetics practices — with a second, distinct pocket in Midtown along Peachtree Street and West Peachtree, and a smaller but notable cluster in West Midtown along Howell Mill Road and Marietta Street. Outside the city core, Marietta is the largest suburban hub by a wide margin, followed by Alpharetta, Roswell, and Sandy Springs — all part of the affluent northern-suburb corridor that's long been Atlanta's med spa growth engine.",
        "With this level of density, real pricing comparison is genuinely possible: a solid share of Atlanta-area med spas on PrimeNearby publish actual per-unit neurotoxin and per-syringe filler pricing, and the gap between a Buckhead boutique injector and a Marietta or Alpharetta suburban practice is often as much about price and membership structure as it is about location.",
      ],
    },
    iv_therapy: {
      paragraphs: [
        "Atlanta's IV and infusion therapy market includes 106 active listings on PrimeNearby, with a little over a third inside the city itself — clustered loosely around the same Buckhead and Midtown corridors that anchor the med spa market, plus a mobile-IV segment that serves the wider metro directly. Marietta is the largest suburban hub, followed by Alpharetta and Roswell, with a smaller cluster in Sandy Springs and Decatur. Several of the metro's larger IV brands operate multiple locations across these suburbs under a shared pricing menu, which makes cross-location comparison unusually straightforward here.",
        "Georgia treats IV hydration as a medical act, not a walk-in wellness product — state nursing guidance specifically requires an individualized order and an in-person evaluation from the prescribing provider before a nurse can administer it, not just a generic standing order. What that means for you as a patient is covered below.",
      ],
    },
    mens_health: {
      paragraphs: [
        "Men's health and TRT clinics in the Atlanta metro total 99 active listings on PrimeNearby, spanning dedicated testosterone clinics, broader men's wellness practices, and a few larger multi-location groups. Inside the city, Atlanta proper and Decatur carry the largest concentrations, with Sandy Springs close behind — all three sit along the same northern perimeter corridor that anchors much of Atlanta's broader medical and wellness industry. Marietta and Alpharetta host smaller but active clusters further out along the same growth corridor.",
        "As with every other vertical in this metro, testosterone is a federally controlled substance, and Georgia adds its own layer on top: nurse practitioners here face real, state-specific restrictions on prescribing controlled substances independently, so a legitimate clinic should be able to explain who's actually writing the prescription and under whose physician oversight. That distinction matters more in Georgia than in states with looser NP prescribing rules — more detail on what to ask about is below.",
      ],
    },
  },
};

export const STATE_REGULATORY_NOTES: Record<string, Partial<Record<BusinessCategory, RegulatoryNote>>> = {
  TX: {
    med_spa: {
      heading: "What to know before you book Botox, filler, or laser treatment in Texas",
      paragraphs: [
        "In Texas, injectable treatments like Botox and dermal fillers, along with most laser-based procedures, are classified as medical acts. A licensed esthetician's or cosmetologist's license does not, by itself, authorize them to inject or operate certain lasers — that work has to happen under the order and delegation of a licensed physician (MD or DO), per Texas Medical Board rules. In practice, that means every legitimate med spa should have a named medical director who has taken on formal, written responsibility for the treatments performed there — a 2026 Texas Medical Board rule update made clear that verbal or informal delegation arrangements are no longer considered compliant, and requires clinics to post signage naming their delegating physician.",
        "It's reasonable to ask a med spa who their medical director is and how the person actually performing your treatment is supervised; a provider who can't answer clearly is worth a second thought.",
      ],
    },
    iv_therapy: {
      heading: "What to know before you book IV therapy in Texas",
      paragraphs: [
        "IV hydration therapy in Texas is a nursing procedure, not a self-service wellness product — the person inserting the line and administering the drip should be a licensed nurse (or higher) acting within their scope of practice, working under a physician-approved protocol or standing order. Texas doesn't mandate one specific IV certification for every provider, so oversight varies more here than in states with stricter rules, which makes it worth asking directly who is administering your IV and under what medical protocol. A legitimate provider should be able to name the supervising physician or medical director behind their standing orders without hesitation.",
      ],
    },
    mens_health: {
      heading: "What to know before you book TRT or men's hormone therapy in Texas",
      paragraphs: [
        "Testosterone is a federally controlled substance (Schedule III), which means real prescribing rules apply no matter how casual a clinic's marketing feels. Legitimate TRT programs require a documented in-person medical evaluation and lab-confirmed diagnosis before treatment starts — federal law (the Ryan Haight Act) specifically prohibits prescribing a controlled substance based on a telehealth-only visit with no in-person exam anywhere in the process, and the Texas Medical Board requires real lab work behind any TRT prescription. Prescribers also need individual DEA registration.",
        "If a clinic offers to start you on testosterone after an online questionnaire alone, with no lab work and no in-person visit anywhere in the process, that's a red flag worth taking seriously.",
      ],
    },
  },
  GA: {
    med_spa: {
      heading: "What to know before you book Botox, filler, or laser treatment in Georgia",
      paragraphs: [
        "Every legitimate med spa in Georgia operates under a Georgia-licensed physician medical director — an MD or DO who holds real, documented responsibility for the treatments performed there, with delegation and nurse-protocol agreements filed before staff can begin practicing. In May 2026, the Georgia Composite Medical Board issued a position statement specifically targeting so-called \"matchmaker\" medical directors — arrangements where a physician signs on as medical director but provides no real clinical oversight — so this is an area regulators are actively watching.",
        "It's reasonable to ask who a med spa's medical director is and how involved they actually are; a clinic that's vague on this point is worth a second look.",
      ],
    },
    iv_therapy: {
      heading: "What to know before you book IV therapy in Georgia",
      paragraphs: [
        "Georgia is stricter here than many states: the Georgia Board of Nursing has stated explicitly that a generic standing order is not sufficient to authorize IV hydration — a physician, nurse practitioner, or physician assistant with prescriptive authority must personally evaluate you, complete a history and physical, and issue an individualized order before a nurse administers your IV. In practice, that means a legitimate Georgia IV provider should be able to describe an actual evaluation step in their process, not just a menu you select from and a nurse who shows up.",
        "If a provider's process skips straight from booking to needle with no evaluation at all, that's worth asking about directly.",
      ],
    },
    mens_health: {
      heading: "What to know before you book TRT or men's hormone therapy in Georgia",
      paragraphs: [
        "Testosterone is a federally controlled substance (Schedule III) everywhere, but Georgia adds its own layer: the state classifies nurse practitioners as having restricted, not full, authority to prescribe controlled substances, which typically means added requirements like physician co-signature. That makes it worth asking a Georgia TRT clinic directly who is actually writing your prescription — a physician, or an NP operating under a documented collaborative agreement — and confirming there's real lab work and an in-person evaluation behind it, since federal rules prohibit prescribing a controlled substance from a telehealth-only visit with no in-person exam anywhere in the process.",
      ],
    },
  },
};

export function getMetroCategoryEditorial(metroSlug: string, stateAbbr: string, category: BusinessCategory) {
  return {
    intro: METRO_CATEGORY_INTROS[metroSlug]?.[category],
    regulatory: STATE_REGULATORY_NOTES[stateAbbr]?.[category],
  };
}
