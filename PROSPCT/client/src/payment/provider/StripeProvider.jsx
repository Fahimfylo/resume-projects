import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(
  "pk_test_51SjDdt3lTY6UaKaEmxyTOWTiNa7hw6MRaKKkWeH6o5dhAwExDhxyqHzmQsWCxf9VVD5B5C8n9U2PUZ9kKukCDTuC0031l8tqrM"
);

function StripeProvider({ children }) {
  return <Elements stripe={stripePromise}>{children}</Elements>;
}

export default StripeProvider;
