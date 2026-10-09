type AccountDashboardSkeletonProps = {
  variant?: "overview" | "orders" | "reviews" | "order-detail";
};

function Shimmer({ className = "" }: { className?: string }) {
  return <span className={`account-skeleton-block ${className}`.trim()} aria-hidden="true" />;
}

function HeadingSkeleton({ showAction = true }: { showAction?: boolean }) {
  return (
    <div className="account-skeleton-heading" aria-hidden="true">
      <div>
        <Shimmer className="account-skeleton-eyebrow" />
        <Shimmer className="account-skeleton-title" />
        <Shimmer className="account-skeleton-copy" />
      </div>
      {showAction && <Shimmer className="account-skeleton-button" />}
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <>
      <HeadingSkeleton showAction={false} />
      <div className="account-skeleton-stats account-skeleton-stats--overview" aria-hidden="true">
        <article className="account-skeleton-card account-skeleton-card--reward">
          <Shimmer className="account-skeleton-label account-skeleton-block--dark" />
          <Shimmer className="account-skeleton-number account-skeleton-block--dark" />
          <Shimmer className="account-skeleton-copy account-skeleton-block--dark" />
          <Shimmer className="account-skeleton-progress account-skeleton-block--dark" />
          <span className="account-skeleton-coin" />
        </article>
      </div>
      <div className="account-skeleton-body account-skeleton-body--overview" aria-hidden="true">
        {[0, 1, 2, 3].map((item) => (
          <article className="account-skeleton-card account-skeleton-card--account-action" key={item}>
            <Shimmer className="account-skeleton-action-icon" />
            <div className="account-skeleton-action-copy">
              <Shimmer className="account-skeleton-subtitle account-skeleton-subtitle--short" />
              <Shimmer className="account-skeleton-copy" />
            </div>
            <Shimmer className="account-skeleton-action-button" />
          </article>
        ))}
      </div>
    </>
  );
}

function OrdersSkeleton() {
  return (
    <>
      <HeadingSkeleton />
      <div className="account-skeleton-order-list account-skeleton-order-list--desktop" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <article className="account-skeleton-card account-skeleton-order-card" key={item}>
            <div className="account-skeleton-order-top">
              <div>
                <Shimmer className="account-skeleton-status" />
                <Shimmer className="account-skeleton-order-id" />
                <Shimmer className="account-skeleton-date" />
              </div>
              <Shimmer className="account-skeleton-price" />
            </div>
            <div className="account-skeleton-pills">
              <Shimmer className="account-skeleton-pill" />
              <Shimmer className="account-skeleton-pill account-skeleton-pill--short" />
            </div>
            <div className="account-skeleton-order-footer">
              <Shimmer className="account-skeleton-copy" />
              <Shimmer className="account-skeleton-points" />
            </div>
          </article>
        ))}
      </div>
      <div className="account-skeleton-order-list account-skeleton-order-list--mobile" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <article className="account-skeleton-order-mobile-card" key={item}>
            <div className="account-skeleton-order-mobile-merchant">
              <Shimmer className="account-skeleton-order-mobile-name" />
              <Shimmer className="account-skeleton-order-mobile-pickup" />
            </div>
            <div className="account-skeleton-order-mobile-details">
              {[0, 1, 2, 3, 4].map((row) => (
                <div className="account-skeleton-order-mobile-row" key={row}>
                  <Shimmer className="account-skeleton-order-mobile-label" />
                  <Shimmer className="account-skeleton-order-mobile-value" />
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function ReviewsSkeleton() {
  return (
    <>
      <HeadingSkeleton />
      <div className="account-skeleton-review-grid" aria-hidden="true">
        <article className="account-skeleton-card account-skeleton-review-form">
          <Shimmer className="account-skeleton-eyebrow" />
          <Shimmer className="account-skeleton-subtitle" />
          <Shimmer className="account-skeleton-input account-skeleton-input--full" />
          <div className="account-skeleton-stars">
            {[0, 1, 2, 3, 4].map((item) => (
              <Shimmer className="account-skeleton-star" key={item} />
            ))}
          </div>
          <Shimmer className="account-skeleton-textarea" />
          <Shimmer className="account-skeleton-save" />
        </article>
        <article className="account-skeleton-card account-skeleton-review-history">
          <Shimmer className="account-skeleton-eyebrow" />
          <Shimmer className="account-skeleton-subtitle account-skeleton-subtitle--short" />
          {[0, 1, 2].map((item) => (
            <div className="account-skeleton-review-row" key={item}>
              <Shimmer className="account-skeleton-review-row-title" />
              <Shimmer className="account-skeleton-copy" />
            </div>
          ))}
        </article>
      </div>
    </>
  );
}


function OrderDetailSkeleton() {
  return (
    <>
      <div className="account-skeleton-detail-heading" aria-hidden="true">
        <div className="account-skeleton-detail-heading-copy">
          <Shimmer className="account-skeleton-detail-order-id" />
          <Shimmer className="account-skeleton-detail-date" />
        </div>
        <Shimmer className="account-skeleton-detail-status" />
      </div>
      <div className="account-skeleton-detail-layout" aria-hidden="true">
        <article className="account-skeleton-card account-skeleton-detail-items">
          <div className="account-skeleton-detail-items-heading">
            <Shimmer className="account-skeleton-detail-section-title" />
            <Shimmer className="account-skeleton-detail-price" />
          </div>
          {[0, 1, 2].map((item) => (
            <div className="account-skeleton-detail-item" key={item}>
              <Shimmer className="account-skeleton-detail-image" />
              <div className="account-skeleton-detail-item-copy">
                <Shimmer className="account-skeleton-detail-item-name" />
                <Shimmer className="account-skeleton-detail-item-note" />
              </div>
              <Shimmer className="account-skeleton-detail-item-total" />
            </div>
          ))}
          <div className="account-skeleton-detail-total">
            <Shimmer className="account-skeleton-detail-total-label" />
            <Shimmer className="account-skeleton-detail-price" />
          </div>
        </article>
        <div className="account-skeleton-detail-sidebar">
          <article className="account-skeleton-card account-skeleton-detail-info">
            <Shimmer className="account-skeleton-detail-section-title" />
            <Shimmer className="account-skeleton-detail-customer" />
            <Shimmer className="account-skeleton-detail-date" />
            <Shimmer className="account-skeleton-detail-item-note" />
          </article>
          <article className="account-skeleton-card account-skeleton-detail-points">
            <Shimmer className="account-skeleton-detail-points-coin" />
            <div className="account-skeleton-detail-item-copy">
              <Shimmer className="account-skeleton-detail-item-note" />
              <Shimmer className="account-skeleton-detail-points-number" />
            </div>
          </article>
          <article className="account-skeleton-card account-skeleton-detail-info">
            <Shimmer className="account-skeleton-detail-section-title" />
            <Shimmer className="account-skeleton-detail-customer" />
            <Shimmer className="account-skeleton-detail-item-note" />
          </article>
        </div>
      </div>
    </>
  );
}

export default function AccountDashboardSkeleton({
  variant = "overview",
}: AccountDashboardSkeletonProps) {
  return (
    <section className="account-skeleton" role="status" aria-live="polite" aria-label={variant === "order-detail" ? "Loading order details" : "Loading account"}>
      <span className="account-skeleton-sr-only">{variant === "order-detail" ? "Loading your order details…" : "Loading your account…"}</span>
      {variant === "order-detail" ? (
        <OrderDetailSkeleton />
      ) : variant === "orders" ? (
        <OrdersSkeleton />
      ) : variant === "reviews" ? (
        <ReviewsSkeleton />
      ) : (
        <OverviewSkeleton />
      )}
    </section>
  );
}
