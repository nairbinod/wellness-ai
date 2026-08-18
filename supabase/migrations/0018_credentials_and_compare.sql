-- Compare Mode's "Credentials" column (e.g. "Board-certified physician on
-- staff," "RN-supervised," "NP-led"). Per the brief this is a data-collection
-- task more than an engineering one — expect it to populate gradually via
-- the claim-flow dashboard, not be complete at launch.
alter table businesses add column if not exists credentials text;
