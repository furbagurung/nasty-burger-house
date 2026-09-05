create index if not exists drip_ledger_order_id_idx
  on public.drip_ledger(order_id);

create index if not exists reviews_order_id_idx
  on public.reviews(order_id);
