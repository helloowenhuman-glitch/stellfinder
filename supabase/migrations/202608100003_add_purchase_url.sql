alter table public.events
add column purchase_url text;

alter table public.events
add constraint events_purchase_url_https_check
check (purchase_url is null or purchase_url ~ '^https://');
