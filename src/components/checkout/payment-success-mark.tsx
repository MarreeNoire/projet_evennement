export function PaymentSuccessMark() {
  return (
    <span className="payment-success-mark" aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        <circle className="payment-success-ring" cx="24" cy="24" r="21" />
        <path className="payment-success-check" d="m14 24 7 7 14-15" />
      </svg>
    </span>
  );
}
