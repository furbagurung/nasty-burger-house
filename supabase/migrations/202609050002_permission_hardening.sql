-- Tighten browser-writable columns after the base customer-platform migration.
-- Auth owns the customer's email identity; customers may only edit profile
-- fields that are intentionally exposed in the account UI.

revoke update on table public.customers from authenticated;
grant update(name, phone, birthday) on table public.customers to authenticated;

-- Customers can create a review for their own completed order, but moderation
-- state and ownership fields are not directly editable from the browser.
revoke insert, update on table public.reviews from authenticated;
grant insert(customer_id, order_id, rating, message) on table public.reviews to authenticated;
grant update(rating, message) on table public.reviews to authenticated;
