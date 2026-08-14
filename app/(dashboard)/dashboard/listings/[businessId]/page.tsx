import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin";
import { CATEGORY_SLUGS } from "@/lib/categories";
import type { Database } from "@/lib/types/database";
import { updateListing, updateLeadStatus, addService, deleteService } from "./actions";

type LeadStatus = Database["public"]["Enums"]["lead_status"];

const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "converted", "rejected"];
const inputClass = "mt-1 w-full border border-rule-strong bg-paper px-3 py-2 text-sm outline-none focus:border-teal";

export default async function ManageListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { businessId } = await params;
  const { saved, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/dashboard");

  const { isAdmin } = await getAdminUser(supabase);

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, category, claimed_by, address, city, state, zip, hours, description, phone, website, booking_url, facebook_url, instagram_url, tiktok_url, financing_options, consult_types, first_time_friendly, responds_to_inquiries, metro:metros(slug, name, state)"
    )
    .eq("id", businessId)
    .maybeSingle();

  if (!business) notFound();
  const isOwner = business.claimed_by === user.id;
  if (!isOwner && !isAdmin) redirect("/dashboard");

  const { data: services } = await supabase
    .from("services")
    .select("id, name, category, price_min, price_max, duration_minutes, description")
    .eq("business_id", businessId)
    .order("name");

  const { data: leads } = await supabase
    .from("leads")
    .select("id, consumer_name, consumer_email, consumer_phone, service_interest, message, status, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  const hoursText = Array.isArray(business.hours) ? (business.hours as string[]).join("\n") : "";

  const listingPath = business.metro
    ? `/${business.metro.slug}/${CATEGORY_SLUGS[business.category]}/${business.slug}`
    : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/dashboard" className="text-sm text-ink-soft hover:text-teal">
        ← Dashboard
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{business.name}</h1>
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/listings/${businessId}/billing`} className="text-sm text-teal underline">
            Billing
          </Link>
          {listingPath ? (
            <Link href={listingPath} className="text-sm text-teal underline">
              View public listing
            </Link>
          ) : null}
        </div>
      </div>

      {!isOwner ? (
        <p className="mt-4 border border-gold px-3 py-2 font-mono text-xs uppercase tracking-wider text-gold">
          Editing as admin — not claimed by an owner
        </p>
      ) : null}

      <section className="mt-8">
        <h2 className="font-semibold">Listing details</h2>
        <form action={updateListing.bind(null, businessId)} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium" htmlFor="name">
              Business name
            </label>
            <input id="name" name="name" required defaultValue={business.name} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="address">
              Street address
            </label>
            <input id="address" name="address" defaultValue={business.address ?? ""} className={inputClass} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium" htmlFor="city">
                City
              </label>
              <input id="city" name="city" defaultValue={business.city ?? ""} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="state">
                State
              </label>
              <input id="state" name="state" maxLength={2} defaultValue={business.state ?? ""} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="zip">
                ZIP
              </label>
              <input id="zip" name="zip" defaultValue={business.zip ?? ""} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="hours">
              Hours of operation <span className="font-normal text-ink-soft">(one line per day)</span>
            </label>
            <textarea
              id="hours"
              name="hours"
              rows={7}
              defaultValue={hoursText}
              placeholder={"Monday: 9:00 AM – 6:00 PM\nTuesday: 9:00 AM – 6:00 PM\n…"}
              className={`${inputClass} font-mono text-xs`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={business.description ?? ""}
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium" htmlFor="phone">
                Phone
              </label>
              <input id="phone" name="phone" defaultValue={business.phone ?? ""} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="website">
                Website
              </label>
              <input id="website" name="website" defaultValue={business.website ?? ""} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="booking_url">
              Booking link
            </label>
            <input
              id="booking_url"
              name="booking_url"
              defaultValue={business.booking_url ?? ""}
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium" htmlFor="facebook_url">
                Facebook
              </label>
              <input
                id="facebook_url"
                name="facebook_url"
                defaultValue={business.facebook_url ?? ""}
                placeholder="https://facebook.com/…"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="instagram_url">
                Instagram
              </label>
              <input
                id="instagram_url"
                name="instagram_url"
                defaultValue={business.instagram_url ?? ""}
                placeholder="https://instagram.com/…"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="tiktok_url">
                TikTok
              </label>
              <input
                id="tiktok_url"
                name="tiktok_url"
                defaultValue={business.tiktok_url ?? ""}
                placeholder="https://tiktok.com/@…"
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium" htmlFor="financing_options">
                Financing options <span className="font-normal text-ink-soft">(comma-separated)</span>
              </label>
              <input
                id="financing_options"
                name="financing_options"
                defaultValue={(business.financing_options ?? []).join(", ")}
                placeholder="CareCredit, 0% APR 12mo"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium" htmlFor="consult_types">
                Consultation types <span className="font-normal text-ink-soft">(comma-separated)</span>
              </label>
              <input
                id="consult_types"
                name="consult_types"
                defaultValue={(business.consult_types ?? []).join(", ")}
                placeholder="In-Person Consultation, Virtual Consultation"
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="first_time_friendly"
                value="yes"
                defaultChecked={business.first_time_friendly}
              />
              First-time friendly
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="responds_to_inquiries"
                value="yes"
                defaultChecked={business.responds_to_inquiries}
              />
              Responds to inquiries
            </label>
          </div>

          {saved ? <p className="text-sm text-teal">Saved.</p> : null}
          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

          <button
            type="submit"
            className="bg-teal px-5 py-2.5 font-mono text-xs tracking-wider uppercase text-teal-ink"
          >
            Save changes
          </button>
        </form>
      </section>

      <section className="mt-12">
        <h2 className="font-semibold">Services &amp; pricing</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Shown on your public listing and used for search/comparison. Leave max price blank if a
          service is a flat rate.
        </p>

        {!services?.length ? (
          <p className="mt-4 text-sm text-ink-soft">No services added yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-rule border border-rule-strong">
            {services.map((service) => (
              <li key={service.id} className="flex items-start justify-between gap-4 p-4">
                <div>
                  <div className="font-semibold">
                    {service.name}
                    {service.category ? (
                      <span className="ml-2 font-mono text-xs font-normal text-ink-soft">
                        {service.category}
                      </span>
                    ) : null}
                  </div>
                  {service.description ? (
                    <p className="mt-1 text-sm text-ink-soft">{service.description}</p>
                  ) : null}
                  <div className="mt-1 font-mono text-xs text-ink-soft">
                    {service.price_min != null ? (
                      <>
                        ${service.price_min}
                        {service.price_max != null && service.price_max !== service.price_min
                          ? `–$${service.price_max}`
                          : ""}
                      </>
                    ) : (
                      "No price set"
                    )}
                    {service.duration_minutes ? ` · ${service.duration_minutes} min` : ""}
                  </div>
                </div>
                <form action={deleteService.bind(null, businessId, service.id)}>
                  <button
                    type="submit"
                    className="font-mono text-xs uppercase text-ink-soft underline hover:text-red-600 dark:hover:text-red-400"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={addService.bind(null, businessId)} className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium" htmlFor="service_name">
              Service name
            </label>
            <input id="service_name" name="name" required placeholder="Botox (per unit)" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="service_category">
              Category <span className="font-normal text-ink-soft">(optional)</span>
            </label>
            <input id="service_category" name="category" placeholder="Injectables" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="duration_minutes">
              Duration <span className="font-normal text-ink-soft">(minutes, optional)</span>
            </label>
            <input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              min="0"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="price_min">
              Price {"(or min, if a range)"}
            </label>
            <input id="price_min" name="price_min" type="number" min="0" step="0.01" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="price_max">
              Max price <span className="font-normal text-ink-soft">(optional)</span>
            </label>
            <input id="price_max" name="price_max" type="number" min="0" step="0.01" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium" htmlFor="service_description">
              Description <span className="font-normal text-ink-soft">(optional)</span>
            </label>
            <textarea id="service_description" name="description" rows={2} className={inputClass} />
          </div>
          <button
            type="submit"
            className="border border-rule-strong px-5 py-2.5 font-mono text-xs tracking-wider uppercase hover:border-ink sm:col-span-2"
          >
            Add service
          </button>
        </form>
      </section>

      <section className="mt-12">
        <h2 className="font-semibold">Leads ({leads?.length ?? 0})</h2>
        {!leads?.length ? (
          <p className="mt-2 text-sm text-ink-soft">No leads yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {leads.map((lead) => (
              <li key={lead.id} className="border border-rule-strong p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{lead.consumer_name}</div>
                    <div className="text-sm text-ink-soft">
                      {lead.consumer_email}
                      {lead.consumer_phone ? ` · ${lead.consumer_phone}` : ""}
                    </div>
                    {lead.service_interest ? (
                      <div className="mt-1 text-sm text-ink-soft">
                        Interested in: {lead.service_interest}
                      </div>
                    ) : null}
                    {lead.message ? <p className="mt-2 text-sm">{lead.message}</p> : null}
                    <div className="mt-2 font-mono text-xs text-ink-soft">
                      {new Date(lead.created_at).toLocaleString()}
                    </div>
                  </div>
                  <form action={updateLeadStatus.bind(null, businessId, lead.id)} className="flex gap-2">
                    <select
                      name="status"
                      defaultValue={lead.status}
                      className="border border-rule-strong bg-paper px-2 py-1 text-sm outline-none focus:border-teal"
                    >
                      {LEAD_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="border border-rule-strong px-2 py-1 font-mono text-xs uppercase"
                    >
                      Update
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
